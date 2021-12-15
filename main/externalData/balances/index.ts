import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import log from 'electron-log'

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

function createBalance (rawBalance: string, decimals: number): Balance {
  return {
    balance: rawBalance,
    displayBalance: new BigNumber(rawBalance).shiftedBy(-decimals).toString()
  }
}

export default function (eth: EthereumProvider) {
  function balanceCalls (owner: string, tokens: TokenDefinition[]): Call<ethers.BigNumber, TokenBalance>[] {
    return tokens.map(token => ({
      target: token.address,
      call: ['balanceOf(address)(uint256)', owner],
      returns: [
        [
          `${token.address.toUpperCase()}_BALANCE`,
          (bn: ethers.BigNumber) => {
            return {
              ...token,
              ...createBalance(bn.toHexString(), token.decimals)
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

      // TODO: do all coins have 18 decimals?
      return { ...createBalance(rawBalance, 18), chainId }
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

      const result = contract.interface.decodeFunctionResult('balanceOf', response)

      return result.balance.toHexString()
    } catch (e) {
      log.warn(`could not load balance for token with address ${token.address}`, e)
      return '0x0'
    }
  }

  async function getTokenBalancesFromContracts (owner: string, tokens: TokenDefinition[]) {
    const balances = tokens.map(async token => {
      const rawBalance = await getTokenBalance(token, owner)

      return {
        ...token,
        ...createBalance(rawBalance, token.decimals)
      }
    })

    return Promise.all(balances)
  }

  async function getTokenBalancesFromMulticall (owner: string, tokens: TokenDefinition[], chainId: number) {
    const calls = balanceCalls(owner, tokens)

    return multicall(chainId, eth).batchCall(calls)
  }

  return {
    getCurrencyBalances: async function (address: string, chains: number[]) {
      const fetchChainBalance = getNativeCurrencyBalance.bind(null, address)

      return Promise.all(chains.map(fetchChainBalance))
    },
    getTokenBalances: async function (owner: string, tokens: TokenDefinition[]) {
      const tokensByChain = tokens.reduce(groupByChain, {} as TokensByChain)
    
      const tokenBalances = await Promise.all(
        Object.entries(tokensByChain).map(([chain, tokens]) => {
          const chainId = parseInt(chain)
    
          const supportsMulticall = multicallSupportsChain(chainId)
    
          // in order to prevent a large amount of calls, only use multicall when specified
          return supportsMulticall
            ? getTokenBalancesFromMulticall(owner, tokens, chainId)
            : getTokenBalancesFromContracts(owner, tokens)
        })
      )
    
      return ([] as TokenBalance[]).concat(...tokenBalances)
    }
  } as BalanceLoader
}
