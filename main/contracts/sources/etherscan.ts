import log from 'electron-log'

import { fetchWithTimeout } from '../../../resources/utils/fetch'

import type { Response } from 'node-fetch'
import type { ContractSource } from '..'

interface EtherscanSourceCodeResponse {
  status: string
  message: string
  result: ContractSourceCodeResult[]
}

interface ContractSourceCodeResult {
  SourceCode: string
  ABI: string
  ContractName: string
  Implementation: string
}

const sourceCapture = /^https?:\/\/(?:api[\.-]?)?(?<source>.*)\//

const getEndpoint = (domain: string, contractAddress: string, apiKey: string) => {
  return `https://${domain}/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`
}

const endpointMap = {
  1: (contractAddress: Address) =>
    getEndpoint('api.etherscan.io', contractAddress, '3SYU5MW5QK8RPCJV1XVICHWKT774993S24'),
  10: (contractAddress: Address) =>
    getEndpoint('api-optimistic.etherscan.io', contractAddress, '3SYU5MW5QK8RPCJV1XVICHWKT774993S24'),
  137: (contractAddress: Address) =>
    getEndpoint('api.polygonscan.com', contractAddress, '2P3U9T63MT26T1X64AAE368UNTS9RKEEBB'),
  42161: (contractAddress: Address) =>
    getEndpoint('api.arbiscan.io', contractAddress, 'VP126CP67QVH9ZEKAZT1UZ751VZ6ZTIZAD')
}

async function parseResponse<T>(response: Response): Promise<T | undefined> {
  if (
    response?.status === 200 &&
    (response?.headers.get('content-type') || '').toLowerCase().includes('json')
  ) {
    return response.json()
  }
  return Promise.resolve(undefined)
}

async function fetchSourceCode(endpointUrl: string): Promise<ContractSourceCodeResult[] | undefined> {
  try {
    const res = await fetchWithTimeout(endpointUrl, {}, 4000)
    const parsedResponse = await parseResponse<EtherscanSourceCodeResponse>(res as Response)

    return parsedResponse?.message === 'OK' ? parsedResponse.result : undefined
  } catch (e) {
    log.warn('Source code response parsing error', e)
    return undefined
  }
}

export function chainSupported(chainId: string) {
  return Object.keys(endpointMap).includes(chainId)
}

export async function fetchEtherscanContract(
  contractAddress: Address,
  chainId: number
): Promise<ContractSource | undefined> {
  if (!(chainId in endpointMap)) {
    return
  }

  const endpointChain = chainId as keyof typeof endpointMap

  try {
    const endpoint = endpointMap[endpointChain](contractAddress)
    const result = await fetchSourceCode(endpoint)

    // etherscan compatible
    if (result?.length) {
      const source = result[0]
      const implementation = source.Implementation

      if (implementation && implementation !== contractAddress) {
        // this is a proxy contract, return the ABI for the source
        return fetchEtherscanContract(implementation, chainId)
      }

      if (source.ABI === 'Contract source code not verified') {
        log.warn(`Contract ${contractAddress} does not have verified ABI in Etherscan`)
        return undefined
      }

      return {
        abi: source.ABI,
        name: source.ContractName,
        source: endpoint.match(sourceCapture)?.groups?.source || ''
      }
    }
  } catch (e) {
    log.warn(`Contract ${contractAddress} not found in Etherscan`, e)
  }
}
