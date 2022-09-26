import log from 'electron-log'

import { fetchWithTimeout } from '../../../resources/utils/fetch'

import type { Response } from 'node-fetch'
import type { JsonFragment } from '@ethersproject/abi'
import type { ContractSource } from '..'

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

function getEndpointUrl (contractAddress: Address, chainId: number) {
  return `https://sourcify.dev/server/files/any/${chainId}/${contractAddress}`
}

async function parseResponse <T>(response: Response): Promise<T | undefined> {
  if (response?.status === 200 && (response?.headers.get('content-type') || '').toLowerCase().includes('json')) {
    return await response.json()
  }
  return Promise.resolve(undefined)
}

async function fetchSourceCode (contractAddress: Address, chainId: number): Promise<SourcifyMetadataFileContent | undefined> {
  const endpointUrl = getEndpointUrl(contractAddress, chainId)
  
  try {
    const res = await fetchWithTimeout(endpointUrl, {}, 4000)
    const parsedResponse = await parseResponse<SourcifySourceCodeResponse>(res as Response)

    return parsedResponse && ['partial', 'full'].includes(parsedResponse.status) ? JSON.parse(parsedResponse.files[0].content) : Promise.reject(`Contract ${contractAddress} not found in Sourcify`)
  } catch (e) {
    log.warn((e as Error).name === 'AbortError' ? 'Sourcify request timed out' : 'Unable to parse Sourcify response', e)
    return undefined
  }
}

export async function fetchSourcifyContract (contractAddress: Address, chainId: number): Promise<ContractSource | undefined> {
  try {
    const result = await fetchSourceCode(contractAddress, chainId)
    
    if (result?.output) {
      const { abi, devdoc: { title } } = result.output
      return { abi: JSON.stringify(abi), name: title as string, source: 'sourcify' }
    }
  } catch (e) {
    log.warn(`Contract ${contractAddress} not found in Sourcify`, e)
  }
}

