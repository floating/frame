import log from 'electron-log'
import fetch, { Response } from 'node-fetch'
import { JsonFragment } from '@ethersproject/abi'
import { hexToNumberString } from 'web3-utils'

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

function sourcifyEndpoint (contractAddress: Address, chainId: string) {
  return `https://sourcify.dev/server/files/any/${hexToNumberString(chainId)}/${contractAddress}`
}

async function parseResponse <T>(response: Response): Promise<T | undefined> {
  if (response?.status === 200 && (response?.headers.get('content-type') || '').toLowerCase().includes('json')) {
    return await response.json()
  }
  return Promise.resolve(undefined)
}

async function fetchSourceCode (contractAddress: Address, chainId: string): Promise<SourcifyMetadataFileContent | undefined> {
  const sourcifyEndpointUrl = sourcifyEndpoint(contractAddress, chainId)  
  const sourcifyRes = await fetch(sourcifyEndpointUrl)
  
  try {
    const parsedSourcifyResponse = await parseResponse<SourcifySourceCodeResponse>(sourcifyRes)

    return parsedSourcifyResponse && ['partial', 'full'].includes(parsedSourcifyResponse.status) ? JSON.parse(parsedSourcifyResponse.files[0].content) : undefined
  } catch (e) {
    console.log('source code response parsing error', e)
    return undefined
  }
}

export async function fetchSourcifyContract (contractAddress: Address, chainId: string): Promise<ContractSource | undefined> {
  try {
    const sourcifyResult = await fetchSourceCode(contractAddress, chainId)
    
    if (sourcifyResult?.output) {
      const { abi, devdoc: { title } } = sourcifyResult.output
      return { abi: JSON.stringify(abi), name: title as string, source: 'sourcify' }
    }
  } catch (e) {
    log.warn(`could not fetch source code for contract ${contractAddress}`, e)
  }
}

