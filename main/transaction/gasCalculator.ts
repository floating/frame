import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util'

import { RawTransaction } from './index'

// TODO: move this to a declaration file?
interface ProviderResponse {
  error: string,
  result: any
}

interface ProviderRequest {
  method: string,
  params: any[],
  id: number,
  jsonrpc: '2.0'
}

function rpcPayload (method: string, params: any[], id = 1): ProviderRequest {
  return {
    method,
    params,
    id,
    jsonrpc: '2.0'
  }
}

export default class GasCalculator {
  private connection
  private defaultGasLevel

  constructor (connection: any  /* Chains */, defaultGasLevel: string) {
    this.connection = connection
    this.defaultGasLevel = defaultGasLevel
  }

  getGasPrice (rawTx: RawTransaction) {
    return this.defaultGasLevel
  }
  
  async getGasEstimate (rawTx: RawTransaction) {
    const targetChain = {
      type: 'ethereum',
      id: rawTx.chainId
    }

    return new Promise<string>((resolve, reject) => {
      const payload = rpcPayload('eth_estimateGas', [rawTx])

      this.connection.send(payload, (response: ProviderResponse) => {
        if (response.error) {
          reject(response.error)
        } else {
          resolve(response.result)
        }
      }, targetChain)
    })
  }

  getMaxPriorityFeePerGas (rawTx: RawTransaction) {
    return '0x3b9aca00' // 1 gwei
  }
  
  async getMaxBaseFeePerGas (rawTx: RawTransaction) {
    const payload = rpcPayload('eth_feeHistory', [1, 'latest', []])

    return new Promise<string>((resolve, reject) => {
      this.connection.send(payload, (response: ProviderResponse) => {
        if (response.error) {
          console.error(`could not load fee history, using default maxBaseFeePerGas=${this.defaultGasLevel}`)
          return resolve(this.defaultGasLevel)
        }

        // plan for max fee of 2 full blocks, each one increasing the fee by 12.5%
        const nextBlockFee = response.result.baseFeePerGas[1] // base fee for next block
        const calculatedFee = Math.ceil(parseInt(nextBlockFee, 16) * 1.125 * 1.125)
        const maxFee = addHexPrefix(calculatedFee.toString(16))

        resolve(maxFee)
      })
    })
  }
}
