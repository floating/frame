/* globals it beforeEach expect */
import GasCalculator from '../../main/transaction/gasCalculator'

let testConnection = {
  send: jest.fn()
}

let gasUsedRatios = [ 0.12024061496050893 ]
let blockRewards = [ [ '0x3b9aca00' ] ]

beforeEach(() => {
  testConnection.send.mockImplementation((payload, cb) => {
    if (payload.method === 'eth_feeHistory') {
      return cb({
        jsonrpc: '2.0',
        id: 1,
        result: {
          baseFeePerGas: [ '0x8', '0x8', '0x8', '0x8', '0x8', '0x8', '0x8', '0x8', '0x8', '0x8', '0xb6' ],
          gasUsedRatio: gasUsedRatios,
          oldestBlock: 8998959,
          reward: blockRewards
        }
      })
    }

    reject('unsupported method', payload)
  })
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

it('uses the default gas fee as the base fee when fee history is unavailable', async () => {
  testConnection.send.mockImplementation((_, cb) => cb({ error: 'connection is down!' }))

  const defaultFee = '0x3b9acae4'
  const gas = new GasCalculator(testConnection, defaultFee)

  const fees = await gas.getFeePerGas()

  expect(fees.maxBaseFeePerGas).toBe(defaultFee)
})

it('uses a default priority fee of one gwei when fee history is unavailable', async () => {
  testConnection.send.mockImplementation((_, cb) => cb({ error: 'connection is down!' }))

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
