import log from 'electron-log'
import BigNumber from 'bignumber.js'
import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber'
import { Interface } from '@ethersproject/abi'
import { addHexPrefix } from '@ethereumjs/util'

import multicall, { Call, supportsChain as multicallSupportsChain } from '../../multicall'
import erc20TokenAbi from './erc-20-abi'
import { groupByChain, TokensByChain } from './reducers'

import type { BytesLike } from '@ethersproject/bytes'
import type EthereumProvider from 'ethereum-provider'
import type { Balance, Token, TokenBalance } from '../../store/state'

const erc20Interface = new Interface(erc20TokenAbi)

export interface CurrencyBalance extends Balance {
  chainId: number
}

export interface BalanceLoader {
  getCurrencyBalances: (address: Address, chains: number[]) => Promise<CurrencyBalance[]>
  getTokenBalances: (address: Address, tokens: Token[]) => Promise<TokenBalance[]>
}

function createBalance(rawBalance: string, decimals: number): Balance {
  return {
    balance: rawBalance,
    displayBalance: new BigNumber(rawBalance).shiftedBy(-decimals).toString()
  }
}

export default function (eth: EthereumProvider) {
  function balanceCalls(owner: string, tokens: Token[]): Call<EthersBigNumber, Balance>[] {
    return tokens.map((token) => ({
      target: token.address,
      call: ['function balanceOf(address address) returns (uint256 value)', owner],
      returns: [
        (bn?: EthersBigNumber) => {
          const hexString = bn ? bn.toHexString() : '0x00'
          return createBalance(hexString, token.decimals)
        }
      ]
    }))
  }

  async function getNativeCurrencyBalance(address: string, chainId: number) {
    try {
      const rawBalance: string = await eth.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
        chainId: addHexPrefix(chainId.toString(16))
      })

      // TODO: do all coins have 18 decimals?
      return { ...createBalance(rawBalance, 18), chainId }
    } catch (e) {
      log.error(`error loading native currency balance for chain id: ${chainId}`, e)
      return { balance: '0x0', displayValue: '0.0', chainId }
    }
  }

  async function getTokenBalance(token: Token, owner: string) {
    const functionData = erc20Interface.encodeFunctionData('balanceOf', [owner])

    const response: BytesLike = await eth.request({
      method: 'eth_call',
      chainId: addHexPrefix(token.chainId.toString(16)),
      params: [{ to: token.address, value: '0x0', data: functionData }, 'latest']
    })

    const result = erc20Interface.decodeFunctionResult('balanceOf', response)

    return result.balance.toHexString()
  }

  async function getTokenBalancesFromContracts(owner: string, tokens: Token[]) {
    const balances = tokens.map(async (token) => {
      try {
        const rawBalance = await getTokenBalance(token, owner)

        return {
          ...token,
          ...createBalance(rawBalance, token.decimals)
        }
      } catch (e) {
        log.warn(`could not load balance for token with address ${token.address}`, e)
        return undefined
      }
    })

    const loadedBalances = await Promise.all(balances)

    return loadedBalances.filter((bal) => bal !== undefined) as TokenBalance[]
  }

  async function getTokenBalancesFromMulticall(owner: string, tokens: Token[], chainId: number) {
    const calls = balanceCalls(owner, tokens)

    const results = await multicall(chainId, eth).batchCall(calls)

    return results.reduce((acc, result, i) => {
      if (result.success) {
        acc.push({
          ...tokens[i],
          ...result.returnValues[0]
        })
      }

      return acc
    }, [] as TokenBalance[])
  }

  return {
    getCurrencyBalances: async function (address: string, chains: number[]) {
      const fetchChainBalance = getNativeCurrencyBalance.bind(null, address)

      return Promise.all(chains.map(fetchChainBalance))
    },
    getTokenBalances: async function (owner: string, tokens: Token[]) {
      const tokensByChain = tokens.reduce(groupByChain, {} as TokensByChain)

      const tokenBalances = await Promise.all(
        Object.entries(tokensByChain).map(([chain, tokens]) => {
          const chainId = parseInt(chain)

          return multicallSupportsChain(chainId)
            ? getTokenBalancesFromMulticall(owner, tokens, chainId)
            : getTokenBalancesFromContracts(owner, tokens)
        })
      )

      return ([] as TokenBalance[]).concat(...tokenBalances)
    }
  } as BalanceLoader
}
