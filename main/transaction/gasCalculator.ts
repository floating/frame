import { intToHex } from 'ethereumjs-util'

const oneGwei = 1e9

// TODO: move these to a declaration file?
interface FeeHistoryResponse {
  baseFeePerGas: string[],
  gasUsedRatio: number[],
  reward: Array<string[]>,
  oldestBlock: string
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

interface GasPrices {
  slow: string,
  standard: string,
  fast: string,
  asap: string
}

function rpcPayload (method: string, params: any[] = [], id = 1): ProviderRequest {
  return {
    method,
    params,
    id,
    jsonrpc: '2.0'
  }
}

export default class GasCalculator {
  private connection

  constructor (connection: any  /* Chains */) {
    this.connection = connection
  }

  async _getFeeHistory(numBlocks: number, rewardPercentiles: number[], newestBlock = 'latest'): Promise<Block[]> {
    const blockCount = intToHex(numBlocks)
    const payload = rpcPayload('eth_feeHistory', [blockCount, newestBlock, rewardPercentiles])

    const feeHistory: FeeHistoryResponse = await this.connection.send(payload)

    const feeHistoryBlocks = feeHistory.baseFeePerGas.map((baseFee, i) => {
      return {
        baseFee: parseInt(baseFee, 16),
        gasUsedRatio: feeHistory.gasUsedRatio[i],
        rewards: (feeHistory.reward[i] || []).map(reward => parseInt(reward, 16))
      }
    })

    return feeHistoryBlocks
  }

  async getGasPrices (): Promise<GasPrices> {
    const gasPrice = await this.connection.send(rpcPayload('eth_gasPrice'))

    // in the future we may want to have specific calculators to calculate variations
    // in the gas price or eliminate this structure altogether
    return {
      slow: gasPrice,
      standard: gasPrice,
      fast: gasPrice,
      asap: gasPrice
    }
  }
  
  async getFeePerGas (): Promise<GasFees> {
    // fetch the last 10 blocks and the bottom 10% of priority fees paid for each block
    const blocks = await this._getFeeHistory(10, [10])
    
    // plan for max fee of 2 full blocks, each one increasing the fee by 12.5%
    const nextBlockFee = blocks[blocks.length - 1].baseFee // base fee for next block
    const calculatedFee = Math.ceil(nextBlockFee * 1.125 * 1.125)

    // only consider priority fees from blocks that aren't almost empty or almost full
    const eligibleRewardsBlocks = blocks.filter(block => block.gasUsedRatio >= 0.1 && block.gasUsedRatio <= 0.9).map(block => block.rewards[0])
    const medianReward = eligibleRewardsBlocks.sort()[Math.floor(eligibleRewardsBlocks.length / 2)] || oneGwei

    return {
      nextBaseFee: intToHex(nextBlockFee),
      maxBaseFeePerGas: intToHex(calculatedFee),
      maxPriorityFeePerGas: intToHex(medianReward),
      maxFeePerGas: intToHex(calculatedFee + medianReward)
    }
  }
}
