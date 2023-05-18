import { intToHex } from '@ethereumjs/util'
import { getFeeHistory, getGas } from '../../../main/gas/index'

let requestHandlers
let testConnection = {
  send: jest.fn((payload) => {
    if (payload.method in requestHandlers) {
      return Promise.resolve(requestHandlers[payload.method](payload.params))
    }

    return Promise.reject('unsupported method: ' + payload.method)
  })
}

const gasPrice = '0x3baa1028'
const nextBlockBaseFee = '0xb6'
let gasUsedRatios, blockRewards

beforeEach(() => {
  gasUsedRatios = []
  blockRewards = []
  requestHandlers = {
    eth_gasPrice: () => gasPrice,
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

describe('#getGas', () => {
  it('should return prices for a legacy chain', async () => {
    const gas = await getGas(testConnection, '250', { baseFeePerGas: '0x108ca0736b' })

    expect(gas).toStrictEqual({
      feeMarket: null,
      gasPrice: { asap: gasPrice, fast: gasPrice, slow: gasPrice, standard: gasPrice }
    })
  })

  it('should return prices for a chain without a baseFeePerGas value', async () => {
    const gas = await getGas(testConnection, '1', {})

    expect(gas).toStrictEqual({
      feeMarket: null,
      gasPrice: { asap: gasPrice, fast: gasPrice, slow: gasPrice, standard: gasPrice }
    })
  })

  it('should return feemarket and a single price for a chain with a baseFeePerGas value', async () => {
    const gas = await getGas(testConnection, '1', { baseFeePerGas: '0x108ca0736b' })

    expect(gas).toStrictEqual({
      feeMarket: {
        maxBaseFeePerGas: '0xe7',
        maxFeePerGas: '0xe7',
        maxPriorityFeePerGas: '0x0',
        nextBaseFee: '0xb6'
      },
      gasPrice: { fast: '0xe7' }
    })
  })
})

describe('#getFeeHistory', () => {
  it('should request the correct percentiles with the eth_feeHistory RPC call', async () => {
    await getFeeHistory(testConnection, 10, [10, 20, 30])
    expect(requestHandlers['eth_feeHistory']).toBeCalledWith([intToHex(10), 'latest', [10, 20, 30]])
  })

  it('should return the correct number of fee history items', async () => {
    const feeHistory = await getFeeHistory(testConnection, 1, [10])
    expect(feeHistory.length).toBe(2)
  })

  it('should return the correct baseFee for the next block', async () => {
    const feeHistory = await getFeeHistory(testConnection, 1, [10])
    expect(feeHistory[1].baseFee).toBe(182)
  })

  it('should return the correct fee data for historical blocks', async () => {
    const feeHistory = await getFeeHistory(testConnection, 1, [10])
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
