import GasCalculator from '../../../main/transaction/gasCalculator'

let requestHandlers
let testConnection = {
  send: jest.fn(payload => {
    if (payload.method in requestHandlers) {
      return Promise.resolve(requestHandlers[payload.method](payload.params))
    }

    return Promise.reject('unsupported method: ' + payload.method)
  })
}

describe('#getGasPrices', () => {
  const gasPrice = '0x3baa1028'

  beforeEach(() => {
    requestHandlers = {
      eth_gasPrice: () => gasPrice
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
  let gasUsedRatios, blockRewards

  beforeEach(() => {
    // default to all blocks being ineligible for priority fee calculation
    gasUsedRatios = Array(31).fill(0)
    blockRewards = Array(31).fill(['0x0'])

    requestHandlers = {
      eth_feeHistory: (params) => {
        const numBlocks = parseInt(params[0] || '0x', 16)

        return {
          baseFeePerGas: Array(numBlocks).fill('0x8').concat(['0xb6']),
          gasUsedRatio: gasUsedRatios,
          oldestBlock: '0x89502f',
          reward: blockRewards
        }
      }
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
      gasUsedRatios = updateEndOfArray(gasUsedRatios, [ 0.12024061496050893, 0.17942918604838942, 0.23114498292513627, 0.1801134637893198 ])
      blockRewards = updateEndOfArray(blockRewards, [ [ '0xee6b2800' ], [ '0x3b9aca00' ], [ '0x77359400' ], [ '0x3b9aca00' ] ])
    
      const gas = new GasCalculator(testConnection)
    
      const fees = await gas.getFeePerGas()
    
      expect(fees.maxPriorityFeePerGas).toBe('0x77359400')
    })
    
    it('excludes full blocks from the priority fee calculation', async () => {
      // all full blocks (gas ratios above 0.9) will be excluded from calculating the median priority fee
      gasUsedRatios = updateEndOfArray(gasUsedRatios, [ 0.91024061496050893, 0.17942918604838942, 0.23114498292513627, 1, 0.1801134637893198 ])
      blockRewards = updateEndOfArray(blockRewards, [ [ '0xee6b2800' ], [ '0x3b9aca00' ], [ '0x77359400' ], [ '0x77359400' ], [ '0x3b9aca00' ] ])
    
      const gas = new GasCalculator(testConnection)
    
      const fees = await gas.getFeePerGas()
    
      expect(fees.maxPriorityFeePerGas).toBe('0x3b9aca00')
    })
    
    it('excludes "empty" blocks from the priority fee calculation', async () => {
      // all empty blocks (gas ratios below 0.1) will be excluded from calculating the median priority fee
      gasUsedRatios = updateEndOfArray(gasUsedRatios, [ 0.01024061496050893, 0.17942918604838942, 0.23114498292513627, 0.0801134637893198, 0.1801134637893198 ])
      blockRewards = updateEndOfArray(blockRewards, [ [ '0xee6b2800' ], [ '0x3b9aca00' ], [ '0x77359400' ], [ '0x77359400' ], [ '0x3b9aca00' ] ])
    
      const gas = new GasCalculator(testConnection)
    
      const fees = await gas.getFeePerGas()
    
      expect(fees.maxPriorityFeePerGas).toBe('0x3b9aca00')
    })
    
    it('considers full blocks if no partial blocks are eligible', async () => {
      // full blocks (gas ratios above 0.9) will be considered only if no blocks with a ratio between 0.1 and 0.9 are available
      gasUsedRatios = updateEndOfArray(gasUsedRatios, [ 0.99024061496050893, 0.07942918604838942, 0.03114498292513627, 1, 0.9801134637893198 ])
      blockRewards = updateEndOfArray(blockRewards, [ [ '0xee6b2800' ], [ '0x3b9aca01' ], [ '0x3b9aca00' ], [ '0x77359400' ], [ '0x3b9aca00' ] ])
    
      const gas = new GasCalculator(testConnection)
    
      const fees = await gas.getFeePerGas()
    
      expect(fees.maxPriorityFeePerGas).toBe('0x77359400')
    })

    it('considers blocks from the entire sample if none of the last 10 blocks are eligible', async () => {
      gasUsedRatios[3] = 0.12
      gasUsedRatios[12] = 0.99
      gasUsedRatios[15] = 0.02 // this block should be ignored as the ratio is too low
      gasUsedRatios[19] = 0.73

      blockRewards[3] = [ '0xee6b2800' ]
      blockRewards[12] = [ '0x3b9aca00' ]
      blockRewards[15] = [ '0x77359400' ] // this block should be ignored as the ratio is too low
      blockRewards[19] = [ '0x9a359400' ]

      const gas = new GasCalculator(testConnection)
    
      const fees = await gas.getFeePerGas()
    
      expect(fees.maxPriorityFeePerGas).toBe('0x9a359400')
    })

    it('uses any recent blocks if no blocks in the sample have the qualifying gas ratios', async () => {
      gasUsedRatios = updateEndOfArray(gasUsedRatios, [ 1.09024061496050893, 0.07942918604838942, 0.03114498292513627, 1.1, 0.0801134637893198 ])
      blockRewards = updateEndOfArray(blockRewards, [ [ '0xee6b2800' ], [ '0x3b9aca01' ], [ '0x3b9aca00' ], [ '0x77359400' ], [ '0x3b9aca00' ] ])
    
      const gas = new GasCalculator(testConnection)
    
      const fees = await gas.getFeePerGas()
    
      expect(fees.maxPriorityFeePerGas).toBe('0x3b9aca01')
    })

    it('uses any block in the sample if no other blocks are eligible', async () => {
      gasUsedRatios[2] = 0.012
      gasUsedRatios[4] = 1.0239
      gasUsedRatios[11] = 1.122
      gasUsedRatios[17] = 0.073

      blockRewards[2] = [ '0xee6b2800' ]
      blockRewards[4] = [ '0x3b9aca00' ]
      blockRewards[11] = [ '0x77359400' ]
      blockRewards[17] = [ '0x9a359400' ]

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
function updateEndOfArray (arr, replacementValues) {
  const target = arr.slice(0, arr.length - replacementValues.length)
  return target.concat(replacementValues)
}
