/* globals it beforeEach expect */
import GasCalculator from '../../main/transaction/gasCalculator'

let requestHandlers
let testConnection = {
  send: jest.fn(payload => {
    if (payload.method in requestHandlers) {
      return Promise.resolve(requestHandlers[payload.method]())
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
  let gasUsedRatios = [ 0.12024061496050893 ]
  let blockRewards = [ [ '0x3b9aca00' ] ]

  beforeEach(() => {
    requestHandlers = {
      eth_feeHistory: () => ({
        baseFeePerGas: [ '0x8', '0x8', '0x8', '0x8', '0x8', '0x8', '0x8', '0x8', '0x8', '0x8', '0xb6' ],
        gasUsedRatio: gasUsedRatios,
        oldestBlock: 8998959,
        reward: blockRewards
      })
    }
  })

  it('calculates the base fee for the next couple blocks', async () => {
    const gas = new GasCalculator(testConnection)
  
    const fees = await gas.getFeePerGas()
  
    expect(fees.maxBaseFeePerGas).toBe('0xe7')
  })
  
  it('calculates the priority fee for the next block based on normal blocks', async () => {
    // all blocks with gas ratios between 0.1 and 0.9 will be considered for calculating the median priority fee
    gasUsedRatios = [ 0.12024061496050893, 0.17942918604838942, 0.23114498292513627, 0.1801134637893198 ]
    blockRewards = [ [ '0xee6b2800' ], [ '0x3b9aca00' ], [ '0x77359400' ], [ '0x3b9aca00' ] ]
  
    const gas = new GasCalculator(testConnection)
  
    const fees = await gas.getFeePerGas()
  
    expect(fees.maxPriorityFeePerGas).toBe('0x77359400')
  })
  
  it('excludes full blocks from the priority fee calculation', async () => {
    // all full blocks (gas ratios above 0.9) will be excluded from calculating the median priority fee
    gasUsedRatios = [ 0.91024061496050893, 0.17942918604838942, 0.23114498292513627, 1, 0.1801134637893198 ]
    blockRewards = [ [ '0xee6b2800' ], [ '0x3b9aca00' ], [ '0x77359400' ], [ '0x77359400' ], [ '0x3b9aca00' ] ]
  
    const gas = new GasCalculator(testConnection)
  
    const fees = await gas.getFeePerGas()
  
    expect(fees.maxPriorityFeePerGas).toBe('0x3b9aca00')
  })
  
  it('excludes "empty" blocks from the priority fee calculation', async () => {
    // all empty blocks (gas ratios below 0.9) will be excluded from calculating the median priority fee
    gasUsedRatios = [ 0.01024061496050893, 0.17942918604838942, 0.23114498292513627, 0.0801134637893198, 0.1801134637893198 ]
    blockRewards = [ [ '0xee6b2800' ], [ '0x3b9aca00' ], [ '0x77359400' ], [ '0x77359400' ], [ '0x3b9aca00' ] ]
  
    const gas = new GasCalculator(testConnection)
  
    const fees = await gas.getFeePerGas()
  
    expect(fees.maxPriorityFeePerGas).toBe('0x3b9aca00')
  })
  
  it('uses a default priority fee of one gwei when no eligible blocks are available', async () => {
    gasUsedRatios = [ 0.01024061496050893, 0.07942918604838942, 1.23114498292513627, 0.0801134637893198, 1.1801134637893198 ]
    blockRewards = [ [ '0xee6b2800' ], [ '0x3b9aca00' ], [ '0x77359400' ], [ '0x77359400' ], [ '0x3b9aca00' ] ]
  
    const gas = new GasCalculator(testConnection)
  
    const fees = await gas.getFeePerGas()
    
    expect(fees.maxBaseFeePerGas).toBe('0xe7')
    expect(fees.maxPriorityFeePerGas).toBe('0x3b9aca00')
  })
})
