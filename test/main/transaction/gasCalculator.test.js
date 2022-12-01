import GasCalculator from '../../../main/transaction/gasCalculator'

let requestHandlers
let testConnection = {
  send: jest.fn((payload) => {
    if (payload.method in requestHandlers) {
      return Promise.resolve(requestHandlers[payload.method](payload.params))
    }

    return Promise.reject('unsupported method: ' + payload.method)
  }),
}

describe('#getGasPrices', () => {
  const gasPrice = '0x3baa1028'

  beforeEach(() => {
    requestHandlers = {
      eth_gasPrice: () => gasPrice,
    }
  })

  it('sets the slow gas price', async () => {
    const calculator = new GasCalculator(testConnection)

    const gas = await calculator.getGasPrices()

    expect(gas.slow).toBe(gasPrice)
  })

  it('sets the standard gas price', async () => {
    const calculator = new GasCalculator(testConnection)

    const gas = await calculator.getGasPrices()

    expect(gas.standard).toBe(gasPrice)
  })

  it('sets the fast gas price', async () => {
    const calculator = new GasCalculator(testConnection)

    const gas = await calculator.getGasPrices()

    expect(gas.fast).toBe(gasPrice)
  })

  it('sets the asap gas price', async () => {
    const calculator = new GasCalculator(testConnection)

    const gas = await calculator.getGasPrices()

    expect(gas.asap).toBe(gasPrice)
  })
})

describe('#getFeePerGas', () => {
  const nextBlockBaseFee = '0xb6'

  let gasUsedRatios, blockRewards

  beforeEach(() => {
    // default to all blocks being ineligible for priority fee calculation
    gasUsedRatios = []
    blockRewards = []

    requestHandlers = {
      eth_feeHistory: (params) => {
        const numBlocks = parseInt(params[0] || '0x', 16)

        return {
          // base fees include the requested number of blocks plus the next block
          baseFeePerGas: Array(numBlocks).fill('0x8').concat([nextBlockBaseFee]),
          gasUsedRatio: fillEmptySlots(gasUsedRatios, numBlocks, 0).reverse(),
          oldestBlock: '0x89502f',
          reward: fillEmptySlots(blockRewards, numBlocks, ['0x0']).reverse(),
        }
      },
    }
  })

  it('calculates the base fee for the next couple blocks', async () => {
    const gas = new GasCalculator(testConnection)

    const fees = await gas.getFeePerGas()

    expect(fees.maxBaseFeePerGas).toBe('0xe7')
  })

  describe('calculating priority fee', () => {
    it('calculates the priority fee for the next block based on normal blocks', async () => {
      // all blocks with gas ratios between 0.1 and 0.9 will be considered for calculating the median priority fee
      gasUsedRatios = [0.12024061496050893, 0.17942918604838942, 0.23114498292513627, 0.1801134637893198]
      blockRewards = [['0xee6b2800'], ['0x3b9aca00'], ['0x77359400'], ['0x3b9aca00']]

      const gas = new GasCalculator(testConnection)

      const fees = await gas.getFeePerGas()

      expect(fees.maxPriorityFeePerGas).toBe('0x77359400')
    })

    it('excludes full blocks from the priority fee calculation', async () => {
      // all full blocks (gas ratios above 0.9) will be excluded from calculating the median priority fee
      gasUsedRatios = [0.91024061496050893, 0.17942918604838942, 0.23114498292513627, 1, 0.1801134637893198]
      blockRewards = [['0xee6b2800'], ['0x3b9aca00'], ['0x77359400'], ['0x77359400'], ['0x3b9aca00']]

      const gas = new GasCalculator(testConnection)

      const fees = await gas.getFeePerGas()

      expect(fees.maxPriorityFeePerGas).toBe('0x3b9aca00')
    })

    it('excludes "empty" blocks from the priority fee calculation', async () => {
      // all empty blocks (gas ratios below 0.1) will be excluded from calculating the median priority fee
      gasUsedRatios = [
        0.01024061496050893, 0.17942918604838942, 0.23114498292513627, 0.0801134637893198, 0.1801134637893198,
      ]
      blockRewards = [['0xee6b2800'], ['0x3b9aca00'], ['0x77359400'], ['0x77359400'], ['0x3b9aca00']]

      const gas = new GasCalculator(testConnection)

      const fees = await gas.getFeePerGas()

      expect(fees.maxPriorityFeePerGas).toBe('0x3b9aca00')
    })

    it('considers full blocks if no partial blocks are eligible', async () => {
      // full blocks (gas ratios above 0.9) will be considered only if no blocks with a ratio between 0.1 and 0.9 are available
      gasUsedRatios = [0.99024061496050893, 0.07942918604838942, 0.03114498292513627, 1, 0.9801134637893198]
      blockRewards = [['0xee6b2800'], ['0x3b9aca01'], ['0x3b9aca00'], ['0x77359400'], ['0x3b9aca00']]

      const gas = new GasCalculator(testConnection)

      const fees = await gas.getFeePerGas()

      expect(fees.maxPriorityFeePerGas).toBe('0x77359400')
    })

    it('considers blocks from the entire sample if none of the last 10 blocks are eligible', async () => {
      // index in array represents distance away from current block
      gasUsedRatios[11] = 0.12
      gasUsedRatios[15] = 0.99
      gasUsedRatios[18] = 0.02 // this block should be ignored as the ratio is too low
      gasUsedRatios[27] = 0.73

      blockRewards[11] = ['0xee6b2800']
      blockRewards[15] = ['0x3b9aca00']
      blockRewards[18] = ['0x77359400'] // this block should be ignored as the ratio is too low
      blockRewards[27] = ['0x9a359400']

      const gas = new GasCalculator(testConnection)

      const fees = await gas.getFeePerGas()

      expect(fees.maxPriorityFeePerGas).toBe('0x9a359400')
    })

    it('uses any recent blocks if no blocks in the sample have the qualifying gas ratios', async () => {
      gasUsedRatios = [1.09024061496050893, 0.07942918604838942, 0.03114498292513627, 1.1, 0.0801134637893198]
      blockRewards = [['0xee6b2800'], ['0x3b9aca01'], ['0x3b9aca00'], ['0x77359400'], ['0x3b9aca00']]

      const gas = new GasCalculator(testConnection)

      const fees = await gas.getFeePerGas()

      expect(fees.maxPriorityFeePerGas).toBe('0x3b9aca01')
    })

    it('uses any block in the sample if no other blocks are eligible', async () => {
      // index in array represents distance away from current block
      gasUsedRatios[13] = 0.012
      gasUsedRatios[19] = 1.2239
      gasUsedRatios[26] = 1.122
      gasUsedRatios[28] = 0.073

      blockRewards[13] = ['0xee6b2800']
      blockRewards[19] = ['0x3b9aca00']
      blockRewards[26] = ['0x77359400']
      blockRewards[28] = ['0x9a359400']

      const gas = new GasCalculator(testConnection)

      const fees = await gas.getFeePerGas()

      expect(fees.maxPriorityFeePerGas).toBe('0x9a359400')
    })

    it('uses the priority fee from the latest block when no eligible blocks are available', async () => {
      const gas = new GasCalculator(testConnection)

      const fees = await gas.getFeePerGas()

      expect(fees.maxBaseFeePerGas).toBe('0xe7')
      expect(fees.maxPriorityFeePerGas).toBe('0x0')
    })
  })
})

// helper functions
function fillEmptySlots(arr, targetLength, value) {
  const target = arr.slice()
  let i = 0

  while (i < targetLength) {
    target[i] = target[i] || value
    i += 1
  }

  return target
}
