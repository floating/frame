import BigNumber from 'bignumber.js'
import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber'
import { Interface } from '@ethersproject/abi'
import { addHexPrefix } from '@ethereumjs/util'
import log from 'electron-log'
import { hexZeroPad, BytesLike } from '@ethersproject/bytes'

import multicall, { Call, supportsChain as multicallSupportsChain } from '../../multicall'
import erc20TokenAbi from './erc-20-abi'
import { groupByChain, TokensByChain } from './reducers'
import type EthereumProvider from 'ethereum-provider'
import { Log, LogProcessor, LogTopic } from './logs'

//TODO: move the log processing outside of the scanning system - on startup seed the balances and then get logs for each block // at a polling interval
const toLogProcessorKey = (owner: Address, chainId: number) => `${chainId}:${owner}`

const logProcessors: Record<string, LogProcessor> = {}

const erc20Interface = new Interface(erc20TokenAbi)

interface ExternalBalance {
  balance: string
  displayBalance: string
}

export interface TokenDefinition extends Omit<Token, 'logoURI'> {
  logoUri?: string
}

export interface TokenBalance extends TokenDefinition, ExternalBalance {}

export interface CurrencyBalance extends ExternalBalance {
  chainId: number
}

export interface BalanceLoader {
  getCurrencyBalances: (address: Address, chains: number[]) => Promise<CurrencyBalance[]>
  getTokenBalances: (address: Address, tokens: TokenDefinition[]) => Promise<TokenBalance[]>
}

function createBalance(rawBalance: string, decimals: number): ExternalBalance {
  return {
    balance: rawBalance,
    displayBalance: new BigNumber(rawBalance).shiftedBy(-decimals).toString()
  }
}

export default function (eth: EthereumProvider) {
  async function getLatestBlock(chainId: number) {
    const blockNumber: string = await eth.request({
      method: 'eth_blockNumber',
      params: [],
      chainId: addHexPrefix(chainId.toString(16))
    })
    return parseInt(blockNumber)
  }

  async function getTransferLogs(address: string, chainId: number, fromBlock: number): Promise<Log[]> {
    const logs = (await Promise.all([
      eth.request({
        method: 'eth_getLogs',
        params: [
          {
            fromBlock: '0x' + fromBlock.toString(16),
            toBlock: 'latest',
            topics: [[LogTopic.TRANSFER, LogTopic.DEPOSIT, LogTopic.WITHDRAWAL], [hexZeroPad(address, 32)]]
          }
        ],
        chainId: addHexPrefix(chainId.toString(16))
      }),
      eth.request({
        method: 'eth_getLogs',
        params: [
          {
            fromBlock: '0x' + fromBlock.toString(16),
            toBlock: 'latest',
            topics: [[LogTopic.TRANSFER], [], [hexZeroPad(address, 32)]]
          }
        ],
        chainId: addHexPrefix(chainId.toString(16))
      })
    ])) as [Log[], Log[]]
    return logs.flat()
  }

  function balanceCalls(owner: string, tokens: TokenDefinition[]): Call<EthersBigNumber, ExternalBalance>[] {
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

  async function getTokenBalance(token: TokenDefinition, owner: string) {
    const functionData = erc20Interface.encodeFunctionData('balanceOf', [owner])

    const response: BytesLike = await eth.request({
      method: 'eth_call',
      chainId: addHexPrefix(token.chainId.toString(16)),
      params: [{ to: token.address, value: '0x0', data: functionData }, 'latest']
    })

    const result = erc20Interface.decodeFunctionResult('balanceOf', response)

    return result.balance.toHexString()
  }

  async function getTokenBalancesFromContracts(owner: string, tokens: TokenDefinition[]) {
    const balances = tokens.map(async (token) => {
      try {
        const rawBalance = await getTokenBalance(token, owner)

        const balance = {
          ...token,
          ...createBalance(rawBalance, token.decimals)
        }
        return balance
      } catch (e) {
        log.warn(`could not load balance for token with address ${token.address}`, e)
        return undefined
      }
    })

    const loadedBalances = await Promise.all(balances)

    return loadedBalances.filter((bal) => bal !== undefined) as Balance[]
  }

  async function getTokenBalancesFromMulticall(owner: string, tokens: TokenDefinition[], chainId: number) {
    const calls = balanceCalls(owner, tokens)

    const results = await multicall(chainId, eth).batchCall(calls)

    const balances = results.reduce((acc, result, i) => {
      if (result.success) {
        const balance = {
          ...tokens[i],
          ...result.returnValues[0]
        }
        acc.push(balance)
      }

      return acc
    }, [] as Balance[])
    return balances
  }

  return {
    getCurrencyBalances: async function (address: string, chains: number[]) {
      const fetchChainBalance = getNativeCurrencyBalance.bind(null, address)

      return Promise.all(chains.map(fetchChainBalance))
    },
    getTokenBalances: async function (owner: string, tokens: TokenDefinition[]) {
      const tokensByChain = tokens.reduce(groupByChain, {} as TokensByChain)

      const tokenBalances = await Promise.all(
        Object.entries(tokensByChain).map(async ([chain, tokens]) => {
          const chainId = parseInt(chain)
          const latestBlock = await getLatestBlock(chainId)
          const logProcessorKey = toLogProcessorKey(owner, chainId)
          const logProcessor = logProcessors[logProcessorKey]
          if (logProcessor) {
            try {
              const logs = await getTransferLogs(owner, chainId, logProcessor.lastProcessedBlock)
              return logProcessor.process(logs, latestBlock, tokens)
            } catch (error) {
              log.warn('Unable to update balances using eth_getLogs', { chainId })
            }
          }

          const balances = multicallSupportsChain(chainId)
            ? await getTokenBalancesFromMulticall(owner, tokens, chainId)
            : await getTokenBalancesFromContracts(owner, tokens)

          logProcessors[logProcessorKey] = new LogProcessor(owner, balances, latestBlock, chainId, eth)

          return balances
        })
      )

      return ([] as TokenBalance[]).concat(...tokenBalances)
    }
  } as BalanceLoader
}
