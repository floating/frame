import log from 'electron-log'
import fetch from 'node-fetch'
import { Interface } from '@ethersproject/abi'
import erc20 from '../externalData/balances/erc-20-abi'

const erc20Abi = JSON.stringify(erc20)

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

// function scanEndpoint (contractAddress: Address, chainId: string) {
//   if (chainId === '0x1') {
//     return `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`
//   } else if (chainId === '0x89') {
//     return `https://api.polygonscan.com/api?module=contract&action=getsourcecode&address=0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270&apikey=YourApiKeyToken`
//   } else if ('optimisim') {
//     return `https://api-optimistic.etherscan.io/api?module=contract&action=getsourcecode&address=0x80AA7cb0006d5DDD91cce684229Ac6e398864606&apikey=YourApiKeyToken`
//   } else if ('arbitrum') {
//     return `https://api.arbiscan.io/api?module=contract&action=getsourcecode&address=0x0000000000000000000000000000000000001004&apikey=YourApiKeyToken`
//   }
// }

async function fetchSourceCode (contractAddress: Address, chainId: string) {
  const res = await fetch(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`)

  if (res.status === 200 && (res.headers.get('content-type') || '').toLowerCase().includes('json')) {
    const parsedResponse = await (res.json() as Promise<EtherscanSourceCodeResponse>)

    if (parsedResponse.message === 'OK') return parsedResponse.result
  }

  return []
}


async function fetchAbi (contractAddress: Address, chainId: string): Promise<ContractSourceCodeResult | undefined> {
  try {
    const sources = await fetchSourceCode(contractAddress, chainId)

    if (sources.length > 0) {
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
  const contractSources: ContractSource[] = [{ name: 'ERC-20', source: 'erc-20 contract', abi: erc20Abi }]
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
