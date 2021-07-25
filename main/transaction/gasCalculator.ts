import { intToHex } from 'ethereumjs-util'
import log from 'electron-log'

import { RawTransaction } from './index'

const oneGwei = '0x3b9aca00'

// TODO: move these to a declaration file?
interface GasEstimateResponse {
  error?: string,
  result: string
}

interface FeeHistoryResponse {
  error?: string,
  result: {
    baseFeePerGas: string[],
    gasUsedRatio: number[],
    reward: Array<string[]>
  }
}

interface ProviderRequest {
  method: string,
  params: any[],
  id: number,
  jsonrpc: '2.0'
}

interface Block {
  baseFee: number,
  rewards: number[],
  gasUsedRatio: number
}

interface Eip1559GasFees {
  maxBaseFeePerGas: string,
  maxPriorityFeePerGas: string
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

      this.connection.send(payload, (response: GasEstimateResponse) => {
        if (response.error) {
          reject(response.error)
        } else {
          resolve(response.result)
        }
      }, targetChain)
    })
  }

  async _getFeeHistory(numBlocks: number, rewardPercentiles: number[], newestBlock = 'latest'): Promise<Block[]> {
    const payload = rpcPayload('eth_feeHistory', [numBlocks, newestBlock, rewardPercentiles])

    return new Promise((resolve, reject) => {
      this.connection.send(payload, (response: FeeHistoryResponse) => {
        if (response.error) return reject()

        const feeHistoryBlocks = response.result.baseFeePerGas.map((baseFee, i) => {
          return {
            baseFee: parseInt(baseFee, 16),
            gasUsedRatio: response.result.gasUsedRatio[i],
            rewards: (response.result.reward[i] || []).map(reward => parseInt(reward, 16))
          }
        })

        resolve(feeHistoryBlocks)
      })
    })
  }
  
  async getFeePerGas (): Promise<Eip1559GasFees> {
    // fetch the last 10 blocks and the bottom 10% of priority fees paid for each block
    try {
      const blocks = await this._getFeeHistory(10, [10])
      
      // plan for max fee of 2 full blocks, each one increasing the fee by 12.5%
      const nextBlockFee = blocks[blocks.length - 1].baseFee // base fee for next block
      const calculatedFee = Math.ceil(nextBlockFee * 1.125 * 1.125)

      // only consider priority fees from blocks that aren't almost empty or almost full
      const eligibleRewardsBlocks = blocks.filter(block => block.gasUsedRatio >= 0.1 && block.gasUsedRatio <= 0.9).map(block => block.rewards[0])
      const medianReward = eligibleRewardsBlocks.sort()[Math.floor(eligibleRewardsBlocks.length / 2)]

      return {
        maxBaseFeePerGas: intToHex(calculatedFee),
        maxPriorityFeePerGas: intToHex(medianReward)
      }
    } catch (e) {
      const defaultGas = { maxBaseFeePerGas: this.defaultGasLevel, maxPriorityFeePerGas: oneGwei }
      log.warn('could not load fee history, using default', defaultGas)
      return defaultGas
    }
  }
}
