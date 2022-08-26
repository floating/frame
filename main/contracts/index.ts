import log from 'electron-log'
import fetch from 'node-fetch'
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

function scanEndpoint (contractAddress: Address, chainId: string) {
  if (chainId === '0x1') {
    return `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`
  } else if (chainId === '0x89') {
    return `https://api.polygonscan.com/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=2P3U9T63MT26T1X64AAE368UNTS9RKEEBB`
  } else if (chainId === '0xa') {
    return `https://api-optimistic.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`
  } else if (chainId === '0xa4b1') {
    return `https://api.arbiscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=VP126CP67QVH9ZEKAZT1UZ751VZ6ZTIZAD`
  }

  return `https://sourcify.dev/server/files/any/${hexToNumberString(chainId)}/${contractAddress}`
}

async function fetchSourceCode (contractAddress: Address, chainId: string) {
  const endpointUrl = scanEndpoint(contractAddress, chainId)
  const res = await fetch(endpointUrl)

  if (res.status === 200 && (res.headers.get('content-type') || '').toLowerCase().includes('json')) {
    const parsedResponse = await res.json()

    if (parsedResponse?.message === 'OK') {
      return (parsedResponse as EtherscanSourceCodeResponse).result
    }
    if (['partial', 'full'].includes(parsedResponse?.status)) {
      return JSON.parse((parsedResponse as SourcifySourceCodeResponse).files[0].content)
    }
  }

  return []
}

async function fetchAbi (contractAddress: Address, chainId: string): Promise<ContractSourceCodeResult | undefined> {
  try {
    const sources = await fetchSourceCode(contractAddress, chainId)

    if (sources.output) {
      // sourcify
      return sources.output.abi
    } else if (sources.length > 0) {
      // etherscan compatible
      const source = sources[0]
      const implementation = source.Implementation

      if (implementation) {
        // this is a proxy contract, return the ABI for the source
        return fetchAbi(implementation, chainId)
      }

      return source
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
    contractSources.push({ name: contractSource.ContractName, source: 'etherscan', abi: contractSource.ABI })
  }

  for (const source of contractSources.reverse()) {
    const decodedCall = decodeCallData(calldata, source.abi)

    if (decodedCall) {
      return {
        contractAddress: contractAddress.toLowerCase(),
        contractName: source.name,
        source: source.source,
        ...decodedCall
      }
    }
  }

  log.warn(`Unable to decode data for contract ${contractAddress}`)
}
