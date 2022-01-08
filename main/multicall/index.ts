// @ts-ignore
import { createWatcher, aggregate } from '@makerdao/multicall'
import { EthereumProvider } from 'eth-provider'
import log from 'electron-log'

import { providers } from 'ethers'

const contractAddresses: { [chainId: number]: string } = {
  1: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // mainnet
  3: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // ropsten
  4: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // rinkeby
  5: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // goerli
  30: '0x6c62bf5440de2cb157205b15c424bceb5c3368f5', // RSK mainnet
  31: '0x9e469e1fc7fb4c5d17897b68eaf1afc9df39f103', // RSK testnet
  42: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // kovan
  56: '0x41263cba59eb80dc200f3e2544eda4ed6a90e76c', // BSC mainnet
  97: '0xae11c5b5f29a6a25e955f0cb8ddcc416f522af5c', // BSC testnet
  100: '0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a', // xdai
  137: '0x11ce4b23bd875d7f5c6a31084f55fde1e9a87507', // polygon
  80001: '0x08411add0b5aa8ee47563b146743c13b3556c9cc' // mumbai
}

type CallResponse<R, T> = [string, PostProcessor<R, T>]
type PostProcessor<R, T> = (val: R) => T

export interface Call<R, T> {
  target: string, // address
  call: string[],
  returns: [CallResponse<R, T>]
}

type CallResults<T> = {
  transformed: {
    [returnKey: string]: T
  }
}

export function supportsChain (chainId: number) {
  return chainId in contractAddresses
}

function chainConfig (chainId: number, eth: EthereumProvider) {
  return {
    multicallAddress: contractAddresses[chainId],
    //rpcUrl: 'http://127.0.0.1:1248'
    provider: eth
  }
}

export default function (chainId: number, eth: EthereumProvider) {
  const config = chainConfig(chainId, eth)

  async function call <R, T> (calls: Call<R, T>[]): Promise<CallResults<T>> {
    return (await aggregate(calls, config)).results
  }

  return {
    call,
    batchCall: async function <R, T> (calls: Call<R, T>[], batchSize = 2000) {
      const numBatches = Math.ceil(calls.length / batchSize)

      const fetches = [...Array(numBatches).keys()].map(async (_, batchIndex) => {
        const batchStart = batchIndex * batchSize
        const batchEnd = batchStart + batchSize
  
        try {
          const results = await call(calls.slice(batchStart, batchEnd))
  
          return Object.values(results.transformed)
        } catch (e) {
          log.error(`multicall error (batch ${batchStart}-${batchEnd}), chainId: ${chainId}, first call: ${JSON.stringify(calls[batchStart])}`, e)
          return []
        }
      })
  
      const fetchResults = await Promise.all(fetches)
      const callResults = ([] as T[]).concat(...fetchResults)
  
      return callResults
    },
    subscribe: function <R, T> (calls: Call<R, T>[], cb: (err: any, val: any) => void) {
      const watcher = createWatcher(calls, config)

      watcher.subscribe((update: any) => cb(null, update))
      watcher.onError(cb)

      watcher.start()

      return watcher
    }
  }
}
