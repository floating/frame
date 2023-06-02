import { addHexPrefix, intToHex } from '@ethereumjs/util'
import store from '../../../main/store'
import { init, populateTransaction } from '../../../main/gas/index'
import { gweiToHex } from '../../../resources/utils'
import { Common } from '@ethereumjs/common'
import { GasFeesSource } from '../../../resources/domain/transaction'

let requestHandlers
let testConnection = {
  send: jest.fn((payload) => {
    if (payload.method in requestHandlers) {
      return Promise.resolve(requestHandlers[payload.method](payload.params))
    }

    return Promise.reject('unsupported method: ' + payload.method)
  })
}

jest.mock('../../../main/store/persist')

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
    const gas = init(testConnection, '250')
    const gasPrices = await gas.getGas({ baseFeePerGas: '0x108ca0736b' })

    expect(gasPrices).toStrictEqual({
      feeMarket: null,
      gasPrice: { asap: gasPrice, fast: gasPrice, slow: gasPrice, standard: gasPrice }
    })
  })

  it('should return prices for a chain without a baseFeePerGas value', async () => {
    const gas = init(testConnection, '1')
    const gasPrices = await gas.getGas({})

    expect(gasPrices).toStrictEqual({
      feeMarket: null,
      gasPrice: { asap: gasPrice, fast: gasPrice, slow: gasPrice, standard: gasPrice }
    })
  })

  it('should return feemarket and a single price for a chain with a baseFeePerGas value', async () => {
    const gas = init(testConnection, '1')
    const gasPrices = await gas.getGas({ baseFeePerGas: '0x108ca0736b' })

    expect(gasPrices).toStrictEqual({
      feeMarket: {
        maxBaseFeePerGas: '0xe7',
        maxFeePerGas: '0xe7',
        maxPriorityFeePerGas: '0x0',
        nextBaseFee: '0xb6'
      },
      gasPrice: { fast: '0xe7' }
    })
  })

  describe('when the chain is Polygon', () => {
    it('should enforce a minimum of 30 gwei for the priority fee', async () => {
      const gas = init(testConnection, '137')
      const gasPrices = await gas.getGas({ baseFeePerGas: '0x108ca0736b' })

      expect(gasPrices.feeMarket.maxPriorityFeePerGas).toBe(gweiToHex(30))
    })

    it('should not change the priority fee if above 30 gwei', async () => {
      requestHandlers.eth_feeHistory.mockImplementationOnce((params) => {
        const numBlocks = parseInt(params[0] || '0x', 16)

        return {
          // base fees include the requested number of blocks plus the next block
          baseFeePerGas: Array(numBlocks).fill('0x8').concat([nextBlockBaseFee]),
          gasUsedRatio: fillEmptySlots(gasUsedRatios, numBlocks, 0).reverse(),
          oldestBlock: '0x89502f',
          reward: fillEmptySlots(blockRewards, numBlocks, ['0xa7a358200']).reverse()
        }
      })
      const gas = init(testConnection, '137')
      const gasPrices = await gas.getGas({ baseFeePerGas: '0x108ca0736b' })

      expect(gasPrices.feeMarket.maxPriorityFeePerGas).toBe(gweiToHex(45))
    })
  })
})

describe('#getFeeHistory', () => {
  let gas

  beforeEach(() => {
    gas = init(testConnection, '1', { baseFeePerGas: '0x108ca0736b' })
  })

  it('should request the correct percentiles with the eth_feeHistory RPC call', async () => {
    await gas.getFeeHistory(10, [10, 20, 30])
    expect(requestHandlers['eth_feeHistory']).toBeCalledWith([intToHex(10), 'latest', [10, 20, 30]])
  })

  it('should return the correct number of fee history items', async () => {
    const feeHistory = await gas.getFeeHistory(1, [10])
    expect(feeHistory.length).toBe(2)
  })

  it('should return the correct baseFee for the next block', async () => {
    const feeHistory = await gas.getFeeHistory(1, [10])
    expect(feeHistory[1].baseFee).toBe(182)
  })

  it('should return the correct fee data for historical blocks', async () => {
    const feeHistory = await gas.getFeeHistory(1, [10])
    expect(feeHistory[0]).toStrictEqual({ baseFee: 8, gasUsedRatio: 0, rewards: [0] })
  })
})

describe('#populateTransaction', () => {
  let rawTx

  beforeEach(() => {
    rawTx = {
      chainId: '0xa',
      gasLimit: '0x61a8',
      value: '0x6f05b59d3b20000',
      to: '0x6635f83421bf059cd8111f180f0727128685bae4',
      data: '0x0000000000000000000006635f83421bf059cd8111f180f0726635f83421bf059cd8111f180f072',
      gasFeesSource: GasFeesSource.Dapp
    }
    store.setGasPrices('ethereum', rawTx.chainId, { fast: '' })
  })

  describe('legacy transactions', () => {
    const chainConfig = new Common({ chain: 'mainnet', hardfork: 'istanbul' })

    it('sets the transaction type', () => {
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.type).toBe('0x0')
    })

    it('uses Frame-supplied gasPrice when the dapp did not specify a value', () => {
      const fastLevel = addHexPrefix((7e9).toString(16))
      store.setGasPrices('ethereum', parseInt(rawTx.chainId), { fast: fastLevel })
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.gasPrice).toBe(fastLevel)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('uses Frame-supplied gasPrice when the dapp specified an invalid value', () => {
      const fastLevel = addHexPrefix((7e9).toString(16))
      store.setGasPrices('ethereum', parseInt(rawTx.chainId), { fast: fastLevel })
      rawTx.gasPrice = ''
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.gasPrice).toBe(fastLevel)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('uses dapp-supplied gasPrice when the dapp specified a valid value', () => {
      store.setGasPrices('ethereum', rawTx.chainId, { fast: addHexPrefix((7e9).toString(16)) })
      rawTx.gasPrice = (6e9).toString(16)
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.gasPrice).toBe(rawTx.gasPrice)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Dapp)
    })
  })

  describe('eip-1559 transactions', () => {
    const chainConfig = new Common({ chain: 'mainnet', hardfork: 'london' })

    beforeEach(() => {
      store.setGasFees('ethereum', parseInt(rawTx.chainId), {
        maxPriorityFeePerGas: '',
        maxBaseFeePerGas: ''
      })
    })

    it('sets the transaction type', () => {
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.type).toBe('0x2')
    })

    it('calculates maxFeePerGas when the dapp did not specify a value', () => {
      store.setGasFees('ethereum', parseInt(rawTx.chainId), {
        maxPriorityFeePerGas: addHexPrefix((3e9).toString(16)),
        maxBaseFeePerGas: addHexPrefix((7e9).toString(16))
      })
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.maxFeePerGas).toBe(addHexPrefix((7e9 + 3e9).toString(16)))
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('calculates maxFeePerGas when the dapp specified an invalid value', () => {
      store.setGasFees('ethereum', parseInt(rawTx.chainId), {
        maxPriorityFeePerGas: addHexPrefix((3e9).toString(16)),
        maxBaseFeePerGas: addHexPrefix((7e9).toString(16))
      })
      rawTx.maxFeePerGas = ''
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.maxFeePerGas).toBe(addHexPrefix((7e9 + 3e9).toString(16)))
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('calculates maxFeePerGas using a dapp-supplied value of maxPriorityFeePerGas', () => {
      store.setGasFees('ethereum', parseInt(rawTx.chainId), {
        maxPriorityFeePerGas: addHexPrefix((3e9).toString(16)),
        maxBaseFeePerGas: addHexPrefix((7e9).toString(16))
      })
      rawTx.maxPriorityFeePerGas = addHexPrefix((4e9).toString(16))
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.maxFeePerGas).toBe(addHexPrefix((7e9 + 4e9).toString(16)))
      expect(tx.gasFeesSource).toBe(GasFeesSource.Dapp)
    })

    it('uses dapp-supplied maxFeePerGas when the dapp specified a valid value', () => {
      store.setGasFees('ethereum', parseInt(rawTx.chainId), {
        maxPriorityFeePerGas: addHexPrefix((3e9).toString(16)),
        maxBaseFeePerGas: addHexPrefix((7e9).toString(16))
      })
      rawTx.maxFeePerGas = (6e9).toString(16)
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.maxFeePerGas).toBe(rawTx.maxFeePerGas)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Dapp)
    })

    it('uses Frame-supplied maxPriorityFeePerGas when the dapp did not specify a value', () => {
      const maxPriorityFeePerGas = addHexPrefix((3e9).toString(16))
      store.setGasFees('ethereum', parseInt(rawTx.chainId), { maxPriorityFeePerGas })
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.maxPriorityFeePerGas).toBe(maxPriorityFeePerGas)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('uses Frame-supplied maxPriorityFeePerGas when the dapp specified an invalid value', () => {
      const maxPriorityFeePerGas = addHexPrefix((3e9).toString(16))
      store.setGasFees('ethereum', parseInt(rawTx.chainId), { maxPriorityFeePerGas })
      rawTx.maxFeePerGas = ''
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.maxPriorityFeePerGas).toBe(maxPriorityFeePerGas)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Frame)
    })

    it('uses dapp-supplied maxPriorityFeePerGas when the dapp specified a valid value', () => {
      store.setGasFees('ethereum', parseInt(rawTx.chainId), {
        maxBaseFeePerGas: addHexPrefix((7e9).toString(16)),
        maxPriorityFeePerGas: addHexPrefix((3e9).toString(16))
      })
      rawTx.maxPriorityFeePerGas = (6e9).toString(16)
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.maxPriorityFeePerGas).toBe(rawTx.maxPriorityFeePerGas)
      expect(tx.gasFeesSource).toBe(GasFeesSource.Dapp)
    })
  })

  describe('eip-2930 transactions', () => {
    const chainConfig = new Common({ chain: 'mainnet', hardfork: 'berlin' })

    it('sets the transaction type', () => {
      const tx = populateTransaction(rawTx, chainConfig)

      expect(tx.type).toBe('0x1')
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
