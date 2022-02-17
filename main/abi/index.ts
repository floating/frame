import log from 'electron-log'
import fetch from 'node-fetch'
import { Interface } from '@ethersproject/abi'
import erc20 from '../externalData/balances/erc-20-abi'
import { Provider } from '../provider'

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

function parseAbi (abiData: string): Interface {
  try {
    return new Interface(abiData)
  } catch (e) {
    log.warn(`could not parse ABI data: ${abiData}`)
    throw e
  }
}

async function fetchSourceCode (contractAddress: Address): Promise<ContractSourceCodeResult | undefined> {
  try {
    const res = await fetch(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`)
    const data = await (res.json() as Promise<EtherscanSourceCodeResponse>)

    if (data && data.message === 'OK' && (data.result || []).length > 0) {
      const implementation = data.result[0].Implementation

      if (implementation) {
        // this is a proxy contract, return the ABI for the source
        return fetchSourceCode(implementation)
      }

      return data.result[0]
    }
  } catch (e) {
    log.warn(`could not fetch source code for contract ${contractAddress}`, e)
  }
}

function decodeData (abi: string, calldata: string) {
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

export async function decodeCalldata (contractAddress: Address, calldata: string): Promise<DecodedCallData | undefined> {
  const contractSources: ContractSource[] = [{ name: 'ERC-20', source: 'erc-20 contract', abi: erc20Abi }]
  const contractSource = await fetchSourceCode(contractAddress)

  if (contractSource) {
    contractSources.push({ name: contractSource.ContractName, source: 'etherscan', abi: contractSource.ABI })
  }

  for (const source of contractSources.reverse()) {
    const decodedCall = decodeData(source.abi, calldata)

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

export function isErc20Approval (data: DecodedCallData) {
  return (
    data.method === 'approve' &&
    data.args.length === 2 &&
    data.args[0].name === 'spender' && data.args[0].type === 'address' &&
    data.args[1].name === 'value' && data.args[1].type === 'uint256'
  )
}

export async function getErc20Decimals (provider: Provider, contractAddress: Address) {
  const erc20Interface = parseAbi(erc20Abi)
  const calldata = erc20Interface.encodeFunctionData('decimals')

  return new Promise<number>(resolve => {
    provider.send({
      id: 1,
      jsonrpc: '2.0',
      _origin: 'frame.eth',
      method: 'eth_call',
      params: [
        {
          to: contractAddress,
          data: calldata,
          value: '0x0'
        }, 'latest'
      ]
    }, res => resolve(parseInt(res.result, 16)))
  })

  // if the contract doesnt provide decimals, try to get the data from Etherscan
}

export function encodeErc20Call (fn: string, params: any[]) {
  const erc20Interface = parseAbi(erc20Abi)
  return erc20Interface.encodeFunctionData(fn, params)
}
