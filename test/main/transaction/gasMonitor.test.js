import { intToHex } from '@ethereumjs/util'
import GasMonitor from '../../../main/transaction/gasMonitor'
import { gweiToHex } from '../../util'

let requestHandlers
let testConnection = {
  send: jest.fn((payload) => {
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
    const monitor = new GasMonitor(testConnection)

    const gas = await monitor.getGasPrices()

    expect(gas.slow).toBe(gasPrice)
  })

  it('sets the standard gas price', async () => {
    const monitor = new GasMonitor(testConnection)

    const gas = await monitor.getGasPrices()

    expect(gas.standard).toBe(gasPrice)
  })

  it('sets the fast gas price', async () => {
    const monitor = new GasMonitor(testConnection)

    const gas = await monitor.getGasPrices()

    expect(gas.fast).toBe(gasPrice)
  })

  it('sets the asap gas price', async () => {
    const monitor = new GasMonitor(testConnection)

    const gas = await monitor.getGasPrices()

    expect(gas.asap).toBe(gasPrice)
  })
})

describe('#getFeeHistory', () => {
  const nextBlockBaseFee = '0xb6'

  let gasUsedRatios, blockRewards

  beforeEach(() => {
    // default to all blocks being ineligible for priority fee calculation
    gasUsedRatios = []
    blockRewards = []

    requestHandlers = {
      eth_feeHistory: jest.fn((params) => {
        const numBlocks = parseInt(params[0] || '0x', 16)

        return {
          // base fees include the requested number of blocks plus the next block
          baseFeePerGas: Array(numBlocks).fill('0x8').concat([nextBlockBaseFee]),
          gasUsedRatio: fillEmptySlots(gasUsedRatios, numBlocks, 0).reverse(),
          oldestBlock: '0x89502f',
          reward: fillEmptySlots(blockRewards, numBlocks, ['0x0']).reverse()
        }
      })
    }
  })

  it('requests the correct percentiles with the eth_feeHistory RPC call', async () => {
    const monitor = new GasMonitor(testConnection)
    await monitor.getFeeHistory(10, [10, 20, 30])
    expect(requestHandlers['eth_feeHistory']).toBeCalledWith([intToHex(10), 'latest', [10, 20, 30]])
  })

  it('return the correct number of fee history items', async () => {
    const monitor = new GasMonitor(testConnection)
    const feeHistory = await monitor.getFeeHistory(1, [10])
    expect(feeHistory.length).toBe(2)
  })

  it('return the correct baseFee for the next block', async () => {
    const monitor = new GasMonitor(testConnection)
    const feeHistory = await monitor.getFeeHistory(1, [10])
    expect(feeHistory[1].baseFee).toBe(182)
  })

  it('return the correct fee data for historical blocks', async () => {
    const monitor = new GasMonitor(testConnection)
    const feeHistory = await monitor.getFeeHistory(1, [10])
    expect(feeHistory[0]).toStrictEqual({ baseFee: 8, gasUsedRatio: 0, rewards: [0] })
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
