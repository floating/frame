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
import { groupByChain, mergeLists, relevantBalances, TokensByChain } from './reducers'

const eth = ethProvider('frame', { name: 'scanWorker' })
let id = 1

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

async function getChains () {
  try {
    const chains: string[] = await eth.request({ method: 'wallet_getChains' })
    return chains.map(chain => parseInt(chain))
  } catch (e) {
    log.error('could not load chains', e)
    return []
  }
}

async function getChainId () {
  return parseInt(await eth.request({ method: 'eth_chainId' }))
}

async function getNativeCurrencyBalance (address: string) {
  const rawBalance = await eth.request({ method: 'eth_getBalance', params: [address, 'latest'] })

  const bnBal = new BigNumber(rawBalance)
  const balance = {
    // TODO how to shift the balance, are all coins the same?
    displayBalance: bnBal.shiftedBy(-18).toString(),
    balance: addHexPrefix(bnBal.toString(16))
  }

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

    console.log({ balance })
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

// scans for any positive token balances from the entire list of known tokens
async function scanForTokenBalances (owner: Address) {
  // for chains that support multicall, we can attempt to load every token that we know about,
  // for all other chains we need to call each contract individually so don't scan every contract
  const chains = await getChains()

  const tokenLists: any[] = chains.map(tokenLoader.getTokens)
  const tokens = tokenLists.reduce(mergeLists, [])

  return getTokenBalances(owner, tokens, true)
  // const tokenList = tokenLoader.getTokens(chainId), knownTokens)
  //   : knownTokens

  // const tokens = tokenList
  //   .filter(token => !symbolsToOmit.includes(token.symbol.toLowerCase())
  //   )
  //   .map(token => ({ ...token, address: token.address.toLowerCase() }))
  
  // const allBalances = useMulticall
  //   ? await getTokenBalancesFromMulticall(owner, tokens, chainId)
  //   : await getTokenBalancesFromContracts(owner, tokens)

  // const intoRelevantBalances = relevantBalances.bind(null, knownTokens.map(kt => kt.address.toLowerCase()))
  // const balances = allBalances.reduce(intoRelevantBalances, [] as TokenBalance[])

  return {  }
}

// loads specific token balances
async function getTokenBalances (owner: string, tokens: TokenDefinition[], multicallOnly = false) {
  
  const tokensByChain = tokens.reduce(groupByChain, {} as TokensByChain)

  const balanceCalls = await Promise.all(
    Object.entries(tokensByChain).map(([chain, tokens]) => {
      const chainId = parseInt(chain)

      const supportsMulticall = multicallSupportsChain(chainId)

      // in order to prevent a large amount of calls, only use multicall when specified
      if (supportsMulticall && chainId === 1) return getTokenBalancesFromMulticall(owner, tokens, chainId)
      else if (!multicallOnly) return getTokenBalancesFromContracts(owner, tokens)
      else return Promise.resolve([])
    })
  )

  return balanceCalls.reduce(relevantBalances, [] as TokenBalance[])
}

// tokenLoader.start()

export {
  getNativeCurrencyBalance,
  scanForTokenBalances,
  getTokenBalances
}
