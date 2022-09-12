import { intToHex } from 'ethereumjs-util'
import log from 'electron-log'

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

  async _getFeeHistory(numBlocks: number, rewardPercentiles: number[], chainId: string, newestBlock = 'latest', ): Promise<Block[]> {
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
    console.log(`feeHistory for chain ${chainId}`, feeHistoryBlocks.map(({ rewards, gasUsedRatio }) => `${rewards[0]} - ${gasUsedRatio}`))

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

  async _getMedianReward (blocks: Block[], lowerPercentile: number, chainId: string): Promise<number> {
    // only consider priority fees from blocks that aren't almost empty or almost full
    const eligibleRewardsBlocks = blocks.filter(block => block.gasUsedRatio >= 0.1 && block.gasUsedRatio <= 0.9).map(block => block.rewards[0])
    const medianReward = eligibleRewardsBlocks.sort()[Math.floor(eligibleRewardsBlocks.length / 2)] 

    // increase percentile by 5% until a value is reached - return 1 gwei when we hit 100%
    if (!medianReward) {
      if (lowerPercentile === 100) {
        return oneGwei
      }
      const nextPercentile = lowerPercentile + 5
      log.info('increasing percentile to ', nextPercentile)
      const nextBlocks = await this._getFeeHistory(10, [nextPercentile], chainId, intToHex(31979691))
      return await this._getMedianReward(nextBlocks, nextPercentile, chainId)
    }
    
    return medianReward
  }

  async getFeePerGas (chainId: string): Promise<GasFees> {
    // fetch the last 10 blocks and the bottom 10% of priority fees paid for each block
    const blocks = chainId === '137' ? await this._getFeeHistory(10, [10], chainId, intToHex(31979691)) : await this._getFeeHistory(10, [10], chainId)
    
    // plan for max fee of 2 full blocks, each one increasing the fee by 12.5%
    const nextBlockFee = blocks[blocks.length - 1].baseFee // base fee for next block
    const calculatedFee = Math.ceil(nextBlockFee * 1.125 * 1.125)

    // only consider priority fees from blocks that aren't almost empty or almost full
    const eligibleRewardsBlocks = blocks.filter(block => block.gasUsedRatio >= 0.1 && block.gasUsedRatio <= 0.9).map(block => block.rewards[0])
    let medianReward = eligibleRewardsBlocks.sort()[Math.floor(eligibleRewardsBlocks.length / 2)]

    if (chainId === '137') {
      // increase number of blocks
      const moreBlocks = await this._getFeeHistory(90, [10], chainId, intToHex(31979721))
      const moreEligibleRewardsBlocks = moreBlocks.filter(block => block.gasUsedRatio >= 0.1 && block.gasUsedRatio <= 0.9).map(block => block.rewards[0])
      const medianRewardMoreBlocks = moreEligibleRewardsBlocks.sort()[Math.floor(moreEligibleRewardsBlocks.length / 2)]

      // percentile increase
      const medianRewardPercentile = await this._getMedianReward(blocks, 10, chainId)

      // remove block filtering
      const unfilteredEligibleRewardsBlocks = blocks.map(block => block.rewards[0])
      const medianRewardGasUsedRatio = unfilteredEligibleRewardsBlocks.sort()[Math.floor(unfilteredEligibleRewardsBlocks.length / 2)]
      
      // log out proposed fixes
      log.info(`Gas calculator proto for: ${chainId}`)
      log.info('median reward percentile approach: ', medianRewardPercentile)
      log.info('gas used ratio approach: ', medianRewardGasUsedRatio)
      log.info('doubled number of blocks approach', medianRewardMoreBlocks)

      medianReward = medianRewardPercentile
    } else if(!medianReward) {
      medianReward = 0
    }

    log.info(`Gas calculator maxPriorityFee calculation for chain ${chainId}: ${medianReward}`)

    return {
      nextBaseFee: intToHex(nextBlockFee),
      maxBaseFeePerGas: intToHex(calculatedFee),
      maxPriorityFeePerGas: intToHex(medianReward),
      maxFeePerGas: intToHex(calculatedFee + medianReward)
    }
  }
}
