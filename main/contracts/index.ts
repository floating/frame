import log from 'electron-log'
import fetch, { Response } from 'node-fetch'
import { Interface } from '@ethersproject/abi'
import erc20 from '../externalData/balances/erc-20-abi'
import { hexToNumberString } from 'web3-utils'

const erc20Abi = JSON.stringify(erc20)

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

interface ContractSourceCodeResult {
  SourceCode: string,
  ABI: string,
  ContractName: string,
  Implementation: string
}

interface ContractSource {
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
    sourceCodeRequests.push(fetch(sourcifyEndpointUrl))
  }
  const sourceCodeResponses = await Promise.all(sourceCodeRequests)
  const [sourcifyRes, scanRes] = sourceCodeResponses

  try {
    const parsedScanResponse = await parseResponse<EtherscanSourceCodeResponse>(scanRes)
    const parsedSourcifyResponse = await parseResponse<SourcifySourceCodeResponse>(sourcifyRes)
    const sourceCodeResults = []
    if (parsedScanResponse?.message === 'OK') {
      sourceCodeResults.push(parsedScanResponse.result)
    }
    if (['partial', 'full'].includes(parsedSourcifyResponse?.status)) {
      sourceCodeResults.push(JSON.parse(parsedSourcifyResponse.files[0].content))
    }
    return sourceCodeResults
  } catch (e) {
    return []
  }
}

async function fetchAbi (contractAddress: Address, chainId: string): Promise<ContractSource | undefined> {
  try {
    const [scanResult, sourcifyResult] = await fetchSourceCode(contractAddress, chainId)
    
    // sourcify
    if (sourcifyResult?.output) {
      // if no scan result and scan supports the chain, return undefined
      if (!scanResult.length && Object.keys(scanEndpoint).includes(chainId)) {
        return undefined
      }

      const { abi, devdoc: { title } } = sourcifyResult.output
      return { abi, name: title, source: 'sourcify' }
    }

    // etherscan compatible
    if (scanResult.length > 0) {
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

export async function decodeContractCall (contractAddress: Address, chainId: string, calldata: string): Promise<DecodedCallData | undefined> {
  const contractSources: ContractSource[] = [{ name: 'ERC-20', source: 'Generic ERC-20', abi: erc20Abi }]
  const contractSource = await fetchAbi(contractAddress, chainId)

  if (contractSource) {
    contractSources.push(contractSource)
  }

  for (const { name, source, abi} of contractSources.reverse()) {
    const decodedCall = decodeCallData(calldata, abi)

    if (decodedCall) {
      return {
        contractAddress: contractAddress.toLowerCase(),
        contractName: name,
        source,
        ...decodedCall
      }
    }
  }

  log.warn(`Unable to decode data for contract ${contractAddress}`)
}
