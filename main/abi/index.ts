import log from 'electron-log'
import fetch from 'node-fetch'
import { id } from '@ethersproject/hash'
import { defaultAbiCoder } from '@ethersproject/abi'

interface EtherscanSourceCodeResponse {
  status: string,
  message: string,
  result: ContractSourceCodeResult[]
}

interface ContractSourceCodeResult {
  ABI: string,
  ContractName: string
}

interface ABIInput {
  type: string,
  name: string
}

interface ABI {
  type: string,
  name: string,
  inputs: ABIInput[]
}

function parseAbi (abiData: string): ABI[] {
  try {
    return JSON.parse(abiData)
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

export default {
  decodeCalldata: async (contractAddress: Address, calldata: string) => {
    const data = await fetchSourceCode(contractAddress)

    if (data && data.message === 'OK' && data.result) {
      const abi = parseAbi(data.result[0].ABI)

      if (abi) {
        const selector = calldata.slice(2, 10)
        const abiMethod = abi.find(abiItem => {
          if (abiItem.type === 'function') {
            const signature = `${abiItem.name}(${abiItem.inputs.map(input => input.type).join(',')})`
            return selector === id(signature).slice(2, 10)
          }
          return false
        })

        if (!abiMethod) {
          log.error('No matching ABI method')
          return
        }

        const payload = `0x${calldata.slice(10, calldata.length)}`
        const types = abiMethod.inputs.map(input => input.type)
        const decoded = defaultAbiCoder.decode(types, payload)

        return {
          contractAddress,
          contractName: data.result[0].ContractName,
          source: 'etherscan',
          method: abiMethod.name,
          args: abiMethod.inputs.map((input, i) => ({ name: input.name, type: input.type, value: decoded[i].toString() }))
        }
      }
    } else {
      throw new Error('Unable to decode data ' + JSON.stringify(data))
    }
  }
}
