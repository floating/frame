import { intToHex } from '@ethereumjs/util'

type RawGasFees = {
  nextBaseFee: number
  maxBaseFeePerGas: number
  maxPriorityFeePerGas: number
  maxFeePerGas: number
}

export type Block = {
  baseFee: number
  rewards: number[]
  gasUsedRatio: number
}

export function feesToHex(fees: RawGasFees) {
  return {
    nextBaseFee: intToHex(fees.nextBaseFee),
    maxBaseFeePerGas: intToHex(fees.maxBaseFeePerGas),
    maxPriorityFeePerGas: intToHex(fees.maxPriorityFeePerGas),
    maxFeePerGas: intToHex(fees.maxFeePerGas)
  }
}

function calculateReward(blocks: Block[]) {
  const recentBlocks = 10
  const allBlocks = blocks.length

  // these strategies will be tried in descending order until one finds
  // at least 1 eligible block from which to calculate the reward
  const rewardCalculationStrategies = [
    // use recent blocks that weren't almost empty or almost full
    { minRatio: 0.1, maxRatio: 0.9, blockSampleSize: recentBlocks },
    // include recent blocks that were full
    { minRatio: 0.1, maxRatio: 1.05, blockSampleSize: recentBlocks },
    // use the entire block sample but still limit to blocks that were not almost empty
    { minRatio: 0.1, maxRatio: 1.05, blockSampleSize: allBlocks },
    // use any recent block with transactions
    { minRatio: 0, maxRatio: Number.MAX_SAFE_INTEGER, blockSampleSize: recentBlocks },
    // use any block with transactions
    { minRatio: 0, maxRatio: Number.MAX_SAFE_INTEGER, blockSampleSize: allBlocks }
  ]

  const eligibleRewardsBlocks = rewardCalculationStrategies.reduce((foundBlocks, strategy) => {
    if (foundBlocks.length === 0) {
      const blockSample = blocks.slice(blocks.length - Math.min(strategy.blockSampleSize, blocks.length))
      const eligibleBlocks = blockSample.filter(
        (block) => block.gasUsedRatio > strategy.minRatio && block.gasUsedRatio <= strategy.maxRatio
      )

      if (eligibleBlocks.length > 0) return eligibleBlocks
    }

    return foundBlocks
  }, [] as Block[])

  // use the median reward from the block sample or use the fee from the last block as a last resort
  const lastBlockFee = blocks[blocks.length - 1].rewards[0]
  return (
    eligibleRewardsBlocks.map((block) => block.rewards[0]).sort()[
      Math.floor(eligibleRewardsBlocks.length / 2)
    ] || lastBlockFee
  )
}

export function estimateGasFees(blocks: Block[]) {
  // plan for max fee of 2 full blocks, each one increasing the fee by 12.5%
  const nextBlockFee = blocks[blocks.length - 1].baseFee // base fee for next block
  const calculatedFee = Math.ceil(nextBlockFee * 1.125 * 1.125)

  // the last block contains only the base fee for the next block but no fee history, so
  // don't use it in the block reward calculation
  const medianBlockReward = calculateReward(blocks.slice(0, blocks.length - 1))

  const estimatedGasFees = {
    nextBaseFee: nextBlockFee,
    maxBaseFeePerGas: calculatedFee,
    maxPriorityFeePerGas: medianBlockReward,
    maxFeePerGas: calculatedFee + medianBlockReward
  }

  return estimatedGasFees
}
