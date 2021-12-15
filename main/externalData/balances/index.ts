import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import log from 'electron-log'
import { addHexPrefix } from 'ethereumjs-util'

import multicall, { Call, supportsChain as multicallSupportsChain } from '../../multicall'
import erc20TokenAbi from './erc-20-abi'

import { groupByChain, TokensByChain } from './reducers'
import { EthereumProvider } from 'eth-provider'

let id = 1

interface Balance {
  balance: string,
  displayBalance: string
}

export interface TokenBalance extends TokenDefinition, Balance {}
export interface CurrencyBalance extends Balance {
  chainId: number
}

export interface BalanceLoader {
  getCurrencyBalances: (address: Address, chains: number[]) => Promise<CurrencyBalance[]>,
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

  async function getNativeCurrencyBalance (address: string, chainId: number) {
    try {
      const rawBalance = await eth.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
        chain: '0x' + chainId.toString(16)
      })

      const bnBal = new BigNumber(rawBalance)
      const balance = {
        // TODO how to shift the balance, are all coins the same?
        displayBalance: bnBal.shiftedBy(-18).toString(),
        balance: addHexPrefix(bnBal.toString(16))
      }

      return { ...balance, chainId }
    } catch (e) {
      log.error(`error loading native currency balance for chain id: ${chainId}`, e)
      return { balance: '0x0', displayValue: '0.0', chainId }
    }
  }

  async function getTokenBalance (token: TokenDefinition, owner: string)  {
    const contract = new ethers.Contract(token.address, erc20TokenAbi)

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
    const balances = tokens.map(async token => {
      const bn = await getTokenBalance(token, owner)

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
        const results = await multicall(chainId, eth).call(calls.slice(batchStart, batchEnd))

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
    getCurrencyBalances: async function (address: string, chains: number[]) {
      const fetchChainBalance = getNativeCurrencyBalance.bind(null, address)

      const calls = chains.map(fetchChainBalance)
      return Promise.all(calls)
    },
    getTokenBalances: async function (owner: string, tokens: TokenDefinition[]) {
      const tokensByChain = tokens.reduce(groupByChain, {} as TokensByChain)
    
      const tokenBalances = await Promise.all(
        Object.entries(tokensByChain).map(([chain, tokens]) => {
          const chainId = parseInt(chain)
    
          const supportsMulticall = multicallSupportsChain(chainId)
    
          // in order to prevent a large amount of calls, only use multicall when specified
          return (supportsMulticall)
            ? getTokenBalancesFromMulticall(owner, tokens, chainId)
            : getTokenBalancesFromContracts(owner, tokens)
        })
      )
    
      return ([] as TokenBalance[]).concat(...tokenBalances)
    }
  } as BalanceLoader
}
