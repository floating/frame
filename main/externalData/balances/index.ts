// @ts-ignore
import ethProvider from 'eth-provider'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import log from 'electron-log'
import { addHexPrefix } from 'ethereumjs-util'

import tokenLoader from '../inventory/tokens'
import multicall, { Call, supportsChain as multicallSupportsChain } from '../../multicall'
import erc20TokenAbi from './erc-20-abi'

import { providers } from 'ethers'

const provider = ethProvider('frame', { name: 'scanWorker' })

export interface FoundBalances {
  [address: string]: TokenBalance
}

export interface TokenBalance extends TokenDefinition {
  balance: string,
  displayBalance: string,
}

export interface BalanceScanOptions {
  knownTokens?: TokenDefinition[],
  omit?: string[],
  onlyKnown?: boolean // if true, only scan for known tokens, not all tokens for a given chain
}

async function getChainId () {
  return parseInt(await provider.request({ method: 'eth_chainId' }))
}

async function getNativeCurrencyBalance (address: string) {
  const rawBalance = await provider.request({ method: 'eth_getBalance', params: [address, 'latest'] })

  const bnBal = new BigNumber(rawBalance)
  const balance = {
    displayBalance: bnBal.shiftedBy(-18).toString(),
    balance: addHexPrefix(bnBal.toString(16))
  }

  // TODO how to shift the balance, are all coins the same?
  return { address, balance, chainId: await getChainId() }
}

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

function mergeTokenLists (lowerPriority: TokenDefinition[], higherPriority: TokenDefinition[]) {
  return [
    ...higherPriority,
    ...(lowerPriority.filter(token => !higherPriority.find(t => t.address === token.address)))
  ]
}

function relevantBalances (knownAddresses: string[], positiveBalances: TokenBalance[], tokenBalance: TokenBalance) {
  if (knownAddresses.includes(tokenBalance.address) || parseInt(tokenBalance.balance) > 0) {
    positiveBalances.push(tokenBalance)
  }

  return positiveBalances
}

async function getTokenBalance (token: TokenDefinition, owner: string, provider: providers.JsonRpcProvider)  {
  const contract = new ethers.Contract(token.address, erc20TokenAbi, provider)

  try {
    const balance = await contract.balanceOf(owner)
    return new BigNumber(balance.toString())
  } catch (e) {
    log.warn(`could not load balance for token with address ${token.address}`, e)
    return new BigNumber(0)
  }
}

async function getTokenBalancesFromContracts (owner: string, tokens: TokenDefinition[]) {
  const web3Provider = new providers.Web3Provider(provider)
  const balances = tokens.map(async token => {
    const bn = await getTokenBalance(token, owner, web3Provider)

    return {
      ...token,
      balance: addHexPrefix(bn.toString(16)),
      displayBalance: bn.shiftedBy(-token.decimals).toString()
    }
  })

  return (await Promise.all(balances))
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

async function getTokenBalances (owner: string, opts: BalanceScanOptions = {}) {
  const chainId = await getChainId()
  const symbolsToOmit = (opts.omit || []).map(symbol => symbol.toLowerCase())
  const knownTokens = opts.knownTokens || []
  const useMulticall = multicallSupportsChain(chainId)

  // for chains that support multicall, we can attempt to load every token that the chain supports,
  // for all other chains we need to call each contract individually so limit the calls
  // to only currently known tokens
  const tokenList = !opts.onlyKnown && useMulticall
    ? mergeTokenLists(tokenLoader.getTokens(chainId), knownTokens)
    : knownTokens

  const tokens = tokenList
    .filter(token => 
      token.chainId === chainId && !symbolsToOmit.includes(token.symbol.toLowerCase())
    )
    .map(token => ({ ...token, address: token.address.toLowerCase() }))
  
  const allBalances = useMulticall
    ? await getTokenBalancesFromMulticall(owner, tokens, chainId)
    : await getTokenBalancesFromContracts(owner, tokens)

  const intoRelevantBalances = relevantBalances.bind(null, knownTokens.map(kt => kt.address.toLowerCase()))
  const balances = allBalances.reduce(intoRelevantBalances, [] as TokenBalance[])

  return { chainId, balances }
}

tokenLoader.start()

export {
  getNativeCurrencyBalance,
  getTokenBalances
}
