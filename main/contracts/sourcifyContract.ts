import log from 'electron-log'
import fetch, { Response } from 'node-fetch'
import { JsonFragment } from '@ethersproject/abi'
import { hexToNumberString } from 'web3-utils'
import type { ContractSource } from '.'

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

function getEndpointUrl (contractAddress: Address, chainId: string) {
  return `https://sourcify.dev/server/files/any/${hexToNumberString(chainId)}/${contractAddress}`
}

async function parseResponse <T>(response: Response): Promise<T | undefined> {
  if (response?.status === 200 && (response?.headers.get('content-type') || '').toLowerCase().includes('json')) {
    return await response.json()
  }
  return Promise.resolve(undefined)
}

async function fetchSourceCode (contractAddress: Address, chainId: string): Promise<SourcifyMetadataFileContent | undefined> {
  const controller = new AbortController()
  const signal = controller.signal
  const endpointUrl = getEndpointUrl(contractAddress, chainId)
  
  try {
    const res = await Promise.race([  //@ts-ignore
      fetch(endpointUrl, { signal }),
      new Promise((_resolve, reject) => setTimeout(() => {
        controller.abort()
        reject()
      }, 4000))
    ])
    const parsedResponse = await parseResponse<SourcifySourceCodeResponse>(res as Response)

    return parsedResponse && ['partial', 'full'].includes(parsedResponse.status) ? JSON.parse(parsedResponse.files[0].content) : Promise.reject(`Contract ${contractAddress} not found in Sourcify`)
  } catch (e) {
    log.warn((e as Error).name === 'AbortError' ? 'Sourcify request timed out' : 'Unable to parse Sourcify response', e);
    return undefined
  }
}

export async function fetchSourcifyContract (contractAddress: Address, chainId: string): Promise<ContractSource | undefined> {
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

