import log from 'electron-log'
import fetch, { Response } from 'node-fetch'
import { Interface, JsonFragment } from '@ethersproject/abi'
import { hexToNumberString } from 'web3-utils'

interface EtherscanSourceCodeResponse {
  status: string,
  message: string,
  result: ContractSourceCodeResult[]
}

interface SourcifySourceCodeResponse {
  status: string,
  files: SourcifySourceCodeFile[]
}

interface SourcifySourceCodeFile {
  name: string
  path: string
  content: string
}

interface SourcifyMetadataFileContent {
  compiler: { version: string },
  language: string,
  output: {
    abi: JsonFragment[],
    devdoc: Partial<{
      details: string
      title: string
    }>
  },
  settings: Partial<{
    compilationTarget: {
      [K: string]: string
    },
    evmVersion: string
    metadata: { 
      [K: string]: string
    }
  }>,
  sources: {
    [K: string]: {
      [J: string]: string | string[]
    }
  },
  version: number
}

interface ContractSourceCodeResult {
  SourceCode: string,
  ABI: string,
  ContractName: string,
  Implementation: string
}

export interface ContractSource {
  abi: string,
  name: string,
  source: string
}

export interface DecodedCallData {
  contractAddress: string,
  contractName: string,
  source: string,
  method: string,
  args: Array<{
    name: string,
    type: string,
    value: string
  }>
}

type SourceCodeResults = {
  scanResult?: EtherscanSourceCodeResponse['result']
  sourcifyResult?: SourcifyMetadataFileContent
}

function parseAbi (abiData: string): Interface | undefined {
  try {
    return new Interface(abiData)
  } catch (e) {
    log.warn(`could not parse ABI data: ${abiData}`)
  }
}

const scanEndpoint = {
  '0x1': {
    name: 'etherscan',
    url: (contractAddress: Address) => `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`,
  },
  '0x89': {
    name: 'polygonscan',
    url: (contractAddress: Address) => `https://api.polygonscan.com/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=2P3U9T63MT26T1X64AAE368UNTS9RKEEBB`,
  },
  '0xa': {
    name: 'optimistic.etherscan',
    url: (contractAddress: Address) => `https://api-optimistic.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`,
  },
  '0xa4b1': {
    name: 'arbiscan',
    url: (contractAddress: Address) => `https://api.arbiscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=VP126CP67QVH9ZEKAZT1UZ751VZ6ZTIZAD`
  }
}

function sourcifyEndpoint (contractAddress: Address, chainId: string) {
  return `https://sourcify.dev/server/files/any/${hexToNumberString(chainId)}/${contractAddress}`
}

async function parseResponse <T>(response: Response): Promise<T> {
  if (response?.status !== 200 || !(response?.headers.get('content-type') || '').toLowerCase().includes('json')) {
    return Promise.reject()
  }
  return await response.json()
}

async function fetchSourceCode (contractAddress: Address, chainId: string) {
  const scanEndpointUrl = scanEndpoint[chainId as keyof typeof scanEndpoint].url(contractAddress)
  const sourcifyEndpointUrl = sourcifyEndpoint(contractAddress, chainId)
  const sourceCodeRequests = [fetch(sourcifyEndpointUrl)]

  if (scanEndpointUrl) {
    sourceCodeRequests.push(fetch(scanEndpointUrl))
  }
  const sourceCodeResponses = await Promise.all(sourceCodeRequests)
  const [sourcifyRes, scanRes] = sourceCodeResponses

  try {
    const parsedScanResponse = await parseResponse<EtherscanSourceCodeResponse>(scanRes)
    const parsedSourcifyResponse = await parseResponse<SourcifySourceCodeResponse>(sourcifyRes)
    const sourceCodeResults: SourceCodeResults = {}
    if (parsedScanResponse?.message === 'OK') {
      sourceCodeResults.scanResult = parsedScanResponse.result
    }
    if (['partial', 'full'].includes(parsedSourcifyResponse?.status)) {
      sourceCodeResults.sourcifyResult = (JSON.parse(parsedSourcifyResponse.files[0].content))
    }
    return sourceCodeResults
  } catch (e) {
    console.log('source code response parsing error', e)
    return {}
  }
}

export async function fetchAbi (contractAddress: Address, chainId: string): Promise<ContractSource | undefined> {
  try {
    const { scanResult, sourcifyResult } = await fetchSourceCode(contractAddress, chainId)
    
    // sourcify
    if (sourcifyResult?.output) {
      // if no scan result and scan supports the chain, return undefined
      if (!scanResult?.length && Object.keys(scanEndpoint).includes(chainId)) {
        return undefined
      }

      const { abi, devdoc: { title } } = sourcifyResult.output
      return { abi: JSON.stringify(abi), name: title as string, source: 'sourcify' }
    }

    // etherscan compatible
    if (scanResult?.length) {
      const source = scanResult[0]
      const implementation = source.Implementation

      if (implementation) {
        // this is a proxy contract, return the ABI for the source
        return fetchAbi(implementation, chainId)
      }

      return { abi: source.ABI, name: source.ContractName, source: scanEndpoint[chainId as keyof typeof scanEndpoint].name }
    }
  } catch (e) {
    log.warn(`could not fetch source code for contract ${contractAddress}`, e)
  }
}

export function decodeCallData (calldata: string, abi: string) {
  const contractInterface = parseAbi(abi)

  if (contractInterface) {
    const sighash = calldata.slice(0, 10)

    try {
      const abiMethod = contractInterface.getFunction(sighash)
      const decoded = contractInterface.decodeFunctionData(sighash, calldata)

      return {
        method: abiMethod.name,
        args: abiMethod.inputs.map((input, i) => ({ name: input.name, type: input.type, value: decoded[i].toString() }))
      }
    } catch (e) {
      log.warn('unknown ABI method for signature', sighash)
    }
  }
}

