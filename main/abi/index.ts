import log from 'electron-log'
import fetch from 'node-fetch'
import { ethers } from 'ethers'
import { Interface } from '@ethersproject/abi'
import erc20 from '../externalData/balances/erc-20-abi'

const erc20Abi = JSON.stringify(erc20)

interface EtherscanSourceCodeResponse {
  status: string,
  message: string,
  result: ContractSourceCodeResult[]
}

interface ContractSourceCodeResult {
  ABI: string,
  ContractName: string
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
    return new ethers.utils.Interface(abiData)
  } catch (e) {
    log.warn(`could not parse ABI data: ${abiData}`)
    throw e
  }
}

async function fetchSourceCode (contractAddress: Address) {
  try {
    const res = await fetch(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`)
    return res.json() as Promise<EtherscanSourceCodeResponse>
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

export default {
  decodeCalldata: async (contractAddress: Address, calldata: string) => {
    const contractSources: ContractSource[] = [{ name: 'ERC-20', source: 'erc-20 contract', abi: erc20Abi }]
    const data = await fetchSourceCode(contractAddress)

    if (data && data.message === 'OK' && data.result) {
      contractSources.push({ name: data.result[0].ContractName, source: 'etherscan', abi: data.result[0].ABI })
    }

    for (const source of contractSources.reverse()) {
      const decodedCall = decodeData(source.abi, calldata)

      if (decodedCall) {
        return {
          contractAddress,
          contractName: source.name,
          source: source.source,
          ...decodedCall
        }
      }
    }

    log.warn(`Unable to decode data for contract ${contractAddress}`)
  }
}
