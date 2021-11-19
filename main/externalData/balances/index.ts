// @ts-ignore
import ethProvider from 'eth-provider'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import log from 'electron-log'

import tokenLoader from '../inventory/tokens'
import multicall, { Call, supportsChain as multicallSupportsChain } from '../../multicall'
import erc20TokenAbi from './erc-20-abi'

const provider = ethProvider('frame', { name: 'scanWorker' })
const web3Provider = new ethers.providers.Web3Provider(provider)

interface FoundBalances {
  [address: string]: TokenBalance
}

interface TokenBalance extends Token {
  balance: BigNumber
}

async function getChainId () {
  return parseInt(await provider.request({ method: 'eth_chainId' }))
}

async function getNativeCurrencyBalance (address: string) {
  const rawBalance = await provider.request({ method: 'eth_getBalance', params: [address, 'latest'] })
  const balance = { balance: new BigNumber(rawBalance).shiftedBy(-18) }

  // TODO how to shift the balance, are all coins the same?
  return { address, balance, chainId: await getChainId() }
}

function balanceCalls (owner: string, tokens: Token[]): Call<BigNumber.Value, TokenBalance>[] {
  return tokens.map(token => ({
    target: token.address,
    call: ['balanceOf(address)(uint256)', owner],
    returns: [
      [
        `${token.address.toUpperCase()}_BALANCE`,
        (val: BigNumber.Value) => ({
          ...token,
          balance: new BigNumber(val).shiftedBy(-token.decimals)
        })
      ]
    ]
  }))
}

function intoPositiveBalances (positiveBalances: FoundBalances, tokenBalance: TokenBalance) {
  if (!tokenBalance.balance.isZero()) {
    positiveBalances[tokenBalance.address] = tokenBalance
  }

  return positiveBalances
}

async function getTokenBalance (token: Token, owner: string) {
  const contract = new ethers.Contract(token.address, erc20TokenAbi, web3Provider)

  try {
    const balance = await contract.balanceOf(owner)
    return new BigNumber(balance.toHexString()).shiftedBy(-token.decimals)
  } catch (e) {
    log.warn(`could not load balance for token with address ${token.address}`, e)
    return new BigNumber(0)
  }
}

async function getTokenBalancesFromContracts (tokens: Token[], owner: string) {
  const balances = tokens.map(async token => {
    const balance = await getTokenBalance(token, owner)

    return {
      ...token,
      balance
    }
  })

  return (await Promise.all(balances)).reduce(intoPositiveBalances, {} as FoundBalances)
}

async function getTokenBalancesFromMulticall (chainId: number, tokens: Token[], owner: string) {
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

  return balanceResults.reduce(intoPositiveBalances, {} as FoundBalances)
}

async function getTokenBalances (owner: string, knownTokens: Token[] = [], omit: string[] = []) {
  const chainId = await getChainId()
  const symbolsToOmit = omit.map(symbol => symbol.toLowerCase())
  const useMulticall = multicallSupportsChain(chainId)

  // for chains that support multicall, we can attempt to load every token that the chain supports,
  // for all other chains we need to call each contract individually so limit the calls
  // to only currently known tokens
  const tokenList = useMulticall
    ? tokenLoader.getTokens(chainId) // TODO: merge with known tokens
    : knownTokens

  const tokens = tokenList
    .filter(token => !symbolsToOmit.includes(token.symbol.toLowerCase()))
    .map(token => ({ ...token, address: token.address.toLowerCase() }))
  
  const balances = useMulticall
    ? await getTokenBalancesFromMulticall(chainId, tokens, owner)
    : await getTokenBalancesFromContracts(tokens, owner)

  return { chainId, balances }
}

tokenLoader.start()

export {
  getNativeCurrencyBalance,
  getTokenBalances
}
