
import { EthereumProvider } from 'eth-provider'
import { Interface } from '@ethersproject/abi'
import log from 'electron-log'

const functionSignature = /function\s+(?<signature>\w+)/

const multicallAbi = [
  'function aggregate(tuple(address target, bytes callData)[] calls) returns (uint256 blockNumber, bytes[] returndata)',
  'function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) returns (tuple(bool success, bytes returndata)[] result)'
]

const multicallInterface = new Interface(multicallAbi)
const memoizedInterfaces: Record<string, Interface> = {}

const multicallAddresses: { [chainId: number]: string } = {
  30: '0x6c62bf5440de2cb157205b15c424bceb5c3368f5', // RSK mainnet
  31: '0x9e469e1fc7fb4c5d17897b68eaf1afc9df39f103', // RSK testnet
  56: '0x41263cba59eb80dc200f3e2544eda4ed6a90e76c', // BSC mainnet
  97: '0xae11c5b5f29a6a25e955f0cb8ddcc416f522af5c', // BSC testnet
  100: '0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a', // xdai
  137: '0x11ce4b23bd875d7f5c6a31084f55fde1e9a87507', // polygon
  80001: '0x08411add0b5aa8ee47563b146743c13b3556c9cc' // mumbai
}

const multicall2Addresses: { [chainId: number]: string } = {
  1: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // mainnet
  3: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // ropsten
  4: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // rinkeby
  5: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // goerli
  42: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // kovan
}

type CallResult<T> = { success: boolean, returnValues: T[] }
type PostProcessor<R, T> = (val: R) => T

enum MulticallVersion {
  V1 = 1, V2 = 2
}

export interface Call<R, T> {
  target: string, // address
  call: string[],
  returns: [PostProcessor<R, T>]
}

interface MulticallConfig {
  address: Address,
  provider: EthereumProvider,
  version: MulticallVersion
}

export function supportsChain (chainId: number) {
  return (chainId in multicallAddresses) || (chainId in multicall2Addresses)
}

function chainConfig (chainId: number, eth: EthereumProvider): MulticallConfig {
  return {
    address: multicallAddresses[chainId] || multicall2Addresses[chainId],
    //rpcUrl: 'http://127.0.0.1:1248'
    provider: eth,
    version: (chainId in multicall2Addresses) ? MulticallVersion.V2 : MulticallVersion.V1
  }
}

async function makeCall (functionName: string, params: any[], config: MulticallConfig) {
  const data = multicallInterface.encodeFunctionData(functionName, params)

  const response = await config.provider.request({
    id: 1,
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      { to: config.address, data }, 'latest'
    ]
  })

  return multicallInterface.decodeFunctionResult(functionName, response)
}

function buildCallData <R, T> (calls: Call<R, T>[]) {
  return calls.map(({ target, call }) => {
    const [fnSignature, ...params] = call
    const fnName = getFunctionNameFromSignature(fnSignature)

    const callInterface = getInterface(fnSignature)
    const calldata = callInterface.encodeFunctionData(fnName, params)

    return [target, calldata]
  })
}

function getResultData (results: any, call: string[]) {
  const [fnSignature] = call
  const callInterface = memoizedInterfaces[fnSignature]
  const fnName = getFunctionNameFromSignature(fnSignature)

  return callInterface.decodeFunctionResult(fnName, results)
}

function getFunctionNameFromSignature (signature: string) {
  const m = signature.match(functionSignature)

  if (!m) {
    throw new Error(`could not parse function name from signature: ${signature}`)
  }
  
  return (m.groups || {}).signature
}

function getInterface (functionSignature: string) {
  if (!(functionSignature in memoizedInterfaces)) {
    memoizedInterfaces[functionSignature] = new Interface([functionSignature])
  }

  return memoizedInterfaces[functionSignature]
}
 
async function aggregate <R, T> (calls: Call<R, T>[], config: MulticallConfig): Promise<CallResult<T>[]> {
  const aggData = buildCallData(calls)
  const response = await makeCall('aggregate', [aggData], config)

  return calls.map(({ call, returns }, i) => {
    const resultData = getResultData(response.returndata[i], call)

    return { success: true, returnValues: returns.map((handler, j) => handler(resultData[j])) }
  })
}

async function tryAggregate <R, T> (calls: Call<R, T>[], config: MulticallConfig) {
  const aggData = buildCallData(calls)
  const response = await makeCall('tryAggregate', [false, aggData], config)

  return calls.map(({ call, returns }, i) => {
    const results = response.result[i]

    if (!results.success) {
      return { success: false, returnValues: [] }
    }

    const resultData = getResultData(results.returndata, call)

    return { success: true, returnValues: returns.map((handler, j) => handler(resultData[j])) }
  })
}

export default function (chainId: number, eth: EthereumProvider) {
  const config = chainConfig(chainId, eth)

  async function call <R, T> (calls: Call<R, T>[]): Promise<CallResult<T>[]> {
    return config.version === MulticallVersion.V2
      ? tryAggregate(calls, config)
      : aggregate(calls, config)
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
  
          return results
        } catch (e) {
          log.error(`multicall error (batch ${batchStart}-${batchEnd}), chainId: ${chainId}, first call: ${JSON.stringify(calls[batchStart])}`, e)
          return []
        }
      })
  
      const fetchResults = await Promise.all(fetches)
      const callResults = ([] as CallResult<T>[]).concat(...fetchResults)
  
      return callResults
    }
  }
}
