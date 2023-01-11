import { intToHex } from '@ethereumjs/util'
import { createGasCalculator } from '../../../../main/chains/gas'
import { gweiToHex } from '../../../util'

describe('#createGasCalculator', () => {
  describe('default gas calculator', () => {
    const gasCalculator = createGasCalculator()

    it('calculates the base fee for the next block', async () => {
      const feeHistory = [
        { baseFee: 8, gasUsedRatio: 0, rewards: [0] },
        { baseFee: 182, rewards: [] }
      ]

      const { maxBaseFeePerGas } = await gasCalculator.calculateGas(feeHistory)

      expect(maxBaseFeePerGas).toBe('0xe7')
    })

    it('calculates the priority fee for the next block based on normal blocks', async () => {
      // all blocks with gas ratios between 0.1 and 0.9 will be considered for calculating the median priority fee
      const feeHistory = [
        { baseFee: 8, gasUsedRatio: 0, rewards: [0] },
        { baseFee: 8, gasUsedRatio: 0.1801134637893198, rewards: [1000000000] },
        { baseFee: 8, gasUsedRatio: 0.23114498292513627, rewards: [2000000000] },
        { baseFee: 8, gasUsedRatio: 0.17942918604838942, rewards: [1000000000] },
        { baseFee: 8, gasUsedRatio: 0.12024061496050893, rewards: [4000000000] },
        { baseFee: 182, rewards: [] }
      ]

      const { maxPriorityFeePerGas } = await gasCalculator.calculateGas(feeHistory)

      expect(maxPriorityFeePerGas).toBe('0x77359400')
    })

    it('excludes full blocks from the priority fee calculation', async () => {
      // all full blocks (gas ratios above 0.9) will be excluded from calculating the median priority fee
      const feeHistory = [
        { baseFee: 8, gasUsedRatio: 0, rewards: [0] },
        { baseFee: 8, gasUsedRatio: 0.1801134637893198, rewards: [1000000000] },
        { baseFee: 8, gasUsedRatio: 1, rewards: [2000000000] },
        { baseFee: 8, gasUsedRatio: 0.23114498292513627, rewards: [2000000000] },
        { baseFee: 8, gasUsedRatio: 0.17942918604838942, rewards: [1000000000] },
        { baseFee: 8, gasUsedRatio: 0.9102406149605089, rewards: [4000000000] },
        { baseFee: 182, rewards: [] }
      ]

      const { maxPriorityFeePerGas } = await gasCalculator.calculateGas(feeHistory)

      expect(maxPriorityFeePerGas).toBe('0x3b9aca00')
    })

    it('excludes "empty" blocks from the priority fee calculation', async () => {
      // all empty blocks (gas ratios below 0.1) will be excluded from calculating the median priority fee
      const feeHistory = [
        { baseFee: 8, gasUsedRatio: 0.1801134637893198, rewards: [1000000000] },
        { baseFee: 8, gasUsedRatio: 0.0801134637893198, rewards: [2000000000] },
        { baseFee: 8, gasUsedRatio: 0.23114498292513627, rewards: [2000000000] },
        { baseFee: 8, gasUsedRatio: 0.17942918604838942, rewards: [1000000000] },
        { baseFee: 8, gasUsedRatio: 0.01024061496050893, rewards: [4000000000] },
        { baseFee: 182, rewards: [] }
      ]

      const { maxPriorityFeePerGas } = await gasCalculator.calculateGas(feeHistory)

      expect(maxPriorityFeePerGas).toBe('0x3b9aca00')
    })

    it('considers full blocks if no partial blocks are eligible', async () => {
      // full blocks (gas ratios above 0.9) will be considered only if no blocks with a ratio between 0.1 and 0.9 are available
      const feeHistory = [
        { baseFee: 8, gasUsedRatio: 0.9801134637893198, rewards: [1000000000] },
        { baseFee: 8, gasUsedRatio: 1, rewards: [2000000000] },
        { baseFee: 8, gasUsedRatio: 0.03114498292513627, rewards: [1000000000] },
        { baseFee: 8, gasUsedRatio: 0.07942918604838942, rewards: [1000000001] },
        { baseFee: 8, gasUsedRatio: 0.990240614960509, rewards: [4000000000] },
        { baseFee: 182, rewards: [] }
      ]

      const { maxPriorityFeePerGas } = await gasCalculator.calculateGas(feeHistory)

      expect(maxPriorityFeePerGas).toBe('0x77359400')
    })

    it('considers blocks from the entire sample if none of the last 10 blocks are eligible', async () => {
      // index in array represents distance away from current block
      const feeHistory = [
        { baseFee: 8, gasUsedRatio: 0.73, rewards: [2587202560] },
        { baseFee: 8, gasUsedRatio: 0.02, rewards: [2000000000] },
        { baseFee: 182, rewards: [] }
      ]

      const { maxPriorityFeePerGas } = await gasCalculator.calculateGas(feeHistory)

      expect(maxPriorityFeePerGas).toBe('0x9a359400')
    })

    it('uses any recent blocks if no blocks in the sample have the qualifying gas ratios', async () => {
      const feeHistory = [
        { baseFee: 8, gasUsedRatio: 0.0801134637893198, rewards: [1000000000] },
        { baseFee: 8, gasUsedRatio: 1.1, rewards: [2000000000] },
        { baseFee: 8, gasUsedRatio: 0.03114498292513627, rewards: [1000000000] },
        { baseFee: 8, gasUsedRatio: 0.07942918604838942, rewards: [1000000001] },
        { baseFee: 8, gasUsedRatio: 1.0902406149605088, rewards: [4000000000] },
        { baseFee: 182, rewards: [] }
      ]

      const { maxPriorityFeePerGas } = await gasCalculator.calculateGas(feeHistory)

      expect(maxPriorityFeePerGas).toBe('0x3b9aca01')
    })

    it('uses any block in the sample if no other blocks are eligible', async () => {
      // index in array represents distance away from current block
      const feeHistory = [
        { baseFee: 8, gasUsedRatio: 0.073, rewards: [2587202560] },
        { baseFee: 8, rewards: [] },
        { baseFee: 8, gasUsedRatio: 1.122, rewards: [2000000000] },
        { baseFee: 8, gasUsedRatio: 1.2239, rewards: [1000000000] },
        { baseFee: 182, rewards: [] }
      ]

      const rewards = feeHistory.reduce(
        (acc, { rewards }) => (rewards.length ? acc.concat(intToHex(rewards[0])) : acc),
        []
      )

      const { maxPriorityFeePerGas } = await gasCalculator.calculateGas(feeHistory)
      expect(rewards.includes(maxPriorityFeePerGas)).toBe(true)
    })

    it('uses the priority fee from the latest block when no eligible blocks are available', async () => {
      const feeHistory = [
        { baseFee: 8, gasUsedRatio: 0, rewards: [0] },
        { baseFee: 182, rewards: [] }
      ]

      const { maxBaseFeePerGas, maxPriorityFeePerGas } = await gasCalculator.calculateGas(feeHistory)
      expect(maxBaseFeePerGas).toBe('0xe7')
      expect(maxPriorityFeePerGas).toBe('0x0')
    })
  })

  describe('polygon gas calculator', () => {
    const gasCalculator = createGasCalculator(137)

    it('should enforce a minimum of 30 gwei for the priority fee', async () => {
      const { maxPriorityFeePerGas } = await gasCalculator.calculateGas([
        { baseFee: 8, gasUsedRatio: 0.07942918604838942, rewards: [1000000000] },
        { baseFee: 8, gasUsedRatio: 0.990240614960509, rewards: [1000000000] },
        { baseFee: 182, rewards: [] }
      ])

      expect(maxPriorityFeePerGas).toBe(gweiToHex(30))
    })

    it('does not change the priority fee if above 30 gwei', async () => {
      const gasCalculator = createGasCalculator(137)

      const { maxPriorityFeePerGas } = await gasCalculator.calculateGas([
        { baseFee: 8, gasUsedRatio: 0.07942918604838942, rewards: [45000000000] },
        { baseFee: 8, gasUsedRatio: 0.990240614960509, rewards: [45000000000] },
        { baseFee: 182, rewards: [] }
      ])

      expect(maxPriorityFeePerGas).toBe(gweiToHex(45))
    })
  })
})
