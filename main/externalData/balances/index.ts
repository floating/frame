import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import log from 'electron-log'
import { addHexPrefix } from 'ethereumjs-util'

import multicall, { Call, supportsChain as multicallSupportsChain } from '../../multicall'
import erc20TokenAbi from './erc-20-abi'

import { providers } from 'ethers'
import { groupByChain, relevantBalances, TokensByChain } from './reducers'
import { EthereumProvider } from 'eth-provider'

let id = 1

interface Balance {
  balance: string,
  displayBalance: string
}

export interface TokenBalance extends TokenDefinition, Balance {}

export interface BalanceLoader {
  getNativeCurrencyBalance: (address: Address) => Promise<Balance>,
  getTokenBalances: (address: Address, tokens: TokenDefinition[]) => Promise<TokenBalance[]>
}

export default function (eth: EthereumProvider) {
  function balanceCalls (owner: string, tokens: TokenDefinition[]): Call<BigNumber.Value, TokenBalance>[] {
    return tokens.map(token => ({
      target: token.address,
      call: ['balanceOf(address)(uint256)', owner],
      returns: [
        [
          `${token.address.toUpperCase()}_BALANCE`,
          (val: BigNumber.Value) => {
            const bn = new BigNumber(val)

            return {
              ...token,
              balance: addHexPrefix(bn.toString(16)),
              displayBalance: bn.shiftedBy(-token.decimals).toString()
            }
          }
        ]
      ]
    }))
  }

  async function getTokenBalance (token: TokenDefinition, owner: string, jsonRpcProvider: providers.JsonRpcProvider)  {
    const contract = new ethers.Contract(token.address, erc20TokenAbi, jsonRpcProvider)

    try {
      const functionData = contract.interface.encodeFunctionData('balanceOf', [owner])

      const response = await eth.request({
        method: 'eth_call',
        jsonrpc: '2.0',
        id,
        chain: '0x' + token.chainId.toString(16),
        params: [{ to: token.address, value: '0x0', data: functionData }, 'latest']
      })

      const balance = contract.interface.decodeFunctionResult('balanceOf', response)

      return new BigNumber(balance.toString())
    } catch (e) {
      log.warn(`could not load balance for token with address ${token.address}`, e)
      return new BigNumber(0)
    }
  }

  async function getTokenBalancesFromContracts (owner: string, tokens: TokenDefinition[]) {
    const web3Provider = new providers.Web3Provider(eth)

    const balances = tokens.map(async token => {
      const bn = await getTokenBalance(token, owner, web3Provider)

      return {
        ...token,
        balance: addHexPrefix(bn.toString(16)),
        displayBalance: bn.shiftedBy(-token.decimals).toString()
      }
    })

    return Promise.all(balances)
  }

  async function getTokenBalancesFromMulticall (owner: string, tokens: TokenDefinition[], chainId: number) {
    const calls = balanceCalls(owner, tokens)
    const BATCH_SIZE = 2000

    const numBatches = Math.ceil(calls.length / BATCH_SIZE)

    // multicall seems to time out sometimes with very large requests, so batch them
    const fetches = [...Array(numBatches).keys()].map(async (_, batchIndex) => {
      const batchStart = batchIndex * BATCH_SIZE
      const batchEnd = batchStart + BATCH_SIZE

      try {
        const results = await multicall(chainId).call(calls.slice(batchStart, batchEnd))

        return Object.values(results.transformed)
      } catch (e) {
        log.error(`unable to load token balances (batch ${batchStart}-${batchEnd}`, e)
        return []
      }
    })

    const fetchResults = await Promise.all(fetches)
    const balanceResults = ([] as TokenBalance[]).concat(...fetchResults)

    return balanceResults
  }

  return {
    getNativeCurrencyBalance: async function (address: string) {
      const rawBalance = await eth.request({ method: 'eth_getBalance', params: [address, 'latest'] })

      const bnBal = new BigNumber(rawBalance)
      const balance = {
        // TODO how to shift the balance, are all coins the same?
        displayBalance: bnBal.shiftedBy(-18).toString(),
        balance: addHexPrefix(bnBal.toString(16))
      }

      return balance
    },
    getTokenBalances: async function (owner: string, tokens: TokenDefinition[]) {
      const tokensByChain = tokens.reduce(groupByChain, {} as TokensByChain)
    
      const balanceCalls = await Promise.all(
        Object.entries(tokensByChain).map(([chain, tokens]) => {
          const chainId = parseInt(chain)
    
          const supportsMulticall = multicallSupportsChain(chainId)
    
          // in order to prevent a large amount of calls, only use multicall when specified
          return (supportsMulticall)
            ? getTokenBalancesFromMulticall(owner, tokens, chainId)
            : getTokenBalancesFromContracts(owner, tokens)
        })
      )
    
      return balanceCalls.reduce(relevantBalances, [] as TokenBalance[])
    }
  }


}
