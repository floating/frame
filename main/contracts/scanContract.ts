import log from 'electron-log'
import fetch, { Response } from 'node-fetch'

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

const scanEndpointMap = {
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

async function parseResponse <T>(response: Response): Promise<T | undefined> {
  if (response?.status === 200 && (response?.headers.get('content-type') || '').toLowerCase().includes('json')) {
    return response.json()
  }
  return Promise.resolve(undefined)
}

async function fetchSourceCode (contractAddress: Address, chainId: string): Promise<ContractSourceCodeResult[] | undefined> {
  const scanEndpoint = scanEndpointMap[chainId as keyof typeof scanEndpointMap]
  const scanEndpointUrl = scanEndpoint?.url(contractAddress)
  
  if (scanEndpointUrl) {
    const scanRes = await fetch(scanEndpointUrl)  
    try {
      const parsedScanResponse = await parseResponse<EtherscanSourceCodeResponse>(scanRes)

      return parsedScanResponse?.message === 'OK' ? parsedScanResponse.result : undefined
    } catch (e) {
      console.log('source code response parsing error', e)
      return undefined
    }
  }
}

export function chainSupported (chainId: string) {
  return Object.keys(scanEndpointMap).includes(chainId)
}

export async function fetchScanContract (contractAddress: Address, chainId: string): Promise<ContractSource | undefined> {
  try {
    const scanResult = await fetchSourceCode(contractAddress, chainId)

    // etherscan compatible
    if (scanResult?.length) {
      const source = scanResult[0]
      const implementation = source.Implementation

      if (implementation) {
        // this is a proxy contract, return the ABI for the source
        return fetchScanContract(implementation, chainId)
      }

      return { abi: source.ABI, name: source.ContractName, source: scanEndpointMap[chainId as keyof typeof scanEndpointMap].name }
    }
  } catch (e) {
    log.warn(`could not fetch source code for contract ${contractAddress}`, e)
  }
}


