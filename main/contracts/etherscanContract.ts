import log from 'electron-log'
import fetch, { Response } from 'node-fetch'
import type { ContractSource } from '.'

interface EtherscanSourceCodeResponse {
  status: string,
  message: string,
  result: ContractSourceCodeResult[]
}

interface ContractSourceCodeResult {
  SourceCode: string,
  ABI: string,
  ContractName: string,
  Implementation: string
}

const sourceCapture = /^https?:\/\/(?:api[\.-]?)?(?<source>.*)\//

const getEndpoint = (domain: string, contractAddress: string, apiKey: string) => {
  return `https://${domain}/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`
}

const endpointMap = {
  '0x1': (contractAddress: Address) => getEndpoint('api.etherscan.io', contractAddress, '3SYU5MW5QK8RPCJV1XVICHWKT774993S24'),
  '0x89': (contractAddress: Address) => getEndpoint('api.polygonscan.com', contractAddress, '2P3U9T63MT26T1X64AAE368UNTS9RKEEBB'),
  '0xa': (contractAddress: Address) => getEndpoint('api-optimistic.etherscan.io', contractAddress, '3SYU5MW5QK8RPCJV1XVICHWKT774993S24'),
  '0xa4b1': (contractAddress: Address) => getEndpoint('api.arbiscan.io', contractAddress, 'VP126CP67QVH9ZEKAZT1UZ751VZ6ZTIZAD')
}

async function parseResponse <T>(response: Response): Promise<T | undefined> {
  if (response?.status === 200 && (response?.headers.get('content-type') || '').toLowerCase().includes('json')) {
    return response.json()
  }
  return Promise.resolve(undefined)
}

async function fetchSourceCode (endpoint: string): Promise<ContractSourceCodeResult[] | undefined> {
  const res = await fetch(endpoint)
  
  try {
    const parsedResponse = await parseResponse<EtherscanSourceCodeResponse>(res)

    return parsedResponse?.message === 'OK' ? parsedResponse.result : undefined
  } catch (e) {
    log.warn('Source code response parsing error', e)
    return undefined
  }
}

export function chainSupported (chainId: string) {
  return Object.keys(endpointMap).includes(chainId)
}

export async function fetchEtherscanContract (contractAddress: Address, chainId: string): Promise<ContractSource | undefined> {
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

      if (implementation) {
        // this is a proxy contract, return the ABI for the source
        return fetchEtherscanContract(implementation, chainId)
      }

      if (source.ABI === 'Contract source code not verified') {
        log.warn(`Contract ${contractAddress} does not have verified ABI in Etherscan`)
        return undefined
      }

      return { abi: source.ABI, name: source.ContractName, source: endpoint.match(sourceCapture)?.groups?.source || '' }
    }
  } catch (e) {
    log.warn(`Contract ${contractAddress} not found in Etherscan`, e)
  }
}


