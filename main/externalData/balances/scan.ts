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
import { LogProcessor, LogTopic } from './logs'

interface Log {
  address: Address
  blockHash: string
  blockNumber: string
  data: string
  logIndex: string
  removed: boolean
  topics: string[]
  transactionHash: string
  transactionIndex: string
}

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
    //TODO: fix this filter: need to also get logs where account is recipient...
    const topics = [[LogTopic.TRANSFER, LogTopic.DEPOSIT, LogTopic.WITHDRAWAL], [hexZeroPad(address, 32)]]
    const filter = {
      fromBlock: '0x' + fromBlock.toString(16),
      toBlock: 'latest',
      topics
    }
    return eth.request({
      method: 'eth_getLogs',
      params: [filter],
      chainId: addHexPrefix(chainId.toString(16))
    })
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

  async function getTokenBalancesFromContracts(
    owner: string,
    tokens: TokenDefinition[],
    latestBlock: number
  ) {
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

  async function getTokenBalancesFromMulticall(
    owner: string,
    tokens: TokenDefinition[],
    chainId: number,
    latestBlock: number
  ) {
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
          const logProcessor = logProcessors[owner]
          if (logProcessor) {
            const logs = await getTransferLogs(owner, chainId, logProcessor.lastProcessedBlock)
            return logProcessor.process(chainId, logs, latestBlock)
          } else {
            log.info('not seeded... will be soon though!')
          }

          const balances = multicallSupportsChain(chainId)
            ? await getTokenBalancesFromMulticall(owner, tokens, chainId, latestBlock)
            : await getTokenBalancesFromContracts(owner, tokens, latestBlock)

          if (!logProcessor) {
            logProcessors[owner] = new LogProcessor(owner, balances, latestBlock)
          }
          return balances
        })
      )

      return ([] as TokenBalance[]).concat(...tokenBalances)
    }
  } as BalanceLoader
}
