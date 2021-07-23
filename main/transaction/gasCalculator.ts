import { RawTransaction } from './index'

// TODO: move this to a declaration file?
interface ProviderResponse {
  error: string,
  result: string
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
      this.connection.send({ id: 1, jsonrpc: '2.0', method: 'eth_estimateGas', params: [rawTx] }, (response: ProviderResponse) => {
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
  
  getMaxBaseFeePerGas (rawTx: RawTransaction) {
    return '0x32' // 50 wei
  }
}
