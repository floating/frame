import Restore from 'react-restore'
import { addHexPrefix, intToHex } from '@ethereumjs/util'

import store from '../../../../../../../main/store'
import link from '../../../../../../../resources/link'
import { screen, render, actAndWait } from '../../../../../../componentSetup'
import AdjustFeeComponent from '../../../../../../../app/tray/Account/Requests/TransactionRequest/AdjustFee'
import { gweiToHex } from '../../../../../../util'

jest.mock('../../../../../../../main/store/persist')
jest.mock('../../../../../../../resources/link', () => ({ rpc: jest.fn() }))

const AdjustFee = Restore.connect(AdjustFeeComponent, store)
let req

beforeEach(() => {
  req = {
    data: {
      type: '0x2',
      gasLimit: '0x61a8',
      maxPriorityFeePerGas: gweiToHex(3),
      maxFeePerGas: gweiToHex(7)
    },
    handlerId: '1'
  }
})

it('renders the base fee input', () => {
  const { getBaseFeeInput } = setupComponent(req)
  expect(getBaseFeeInput().value).toBe('4')
})

it('renders the priority fee input', () => {
  const { getPriorityFeeInput } = setupComponent(req)
  expect(getPriorityFeeInput().value).toBe('3')
})

it('renders the gas limit input', () => {
  const { getGasLimitInput } = setupComponent(req)
  expect(getGasLimitInput().value).toBe('25000')
})

describe('base fee input', () => {
  const submittedAmounts = [
    { amount: (100e9).toString(), submitted: '9999' },
    { amount: (1e9).toString(), submitted: '9999' },
    { amount: '9.2', submitted: '9.2' },
    { amount: '9.222222222222222', submitted: '9.222222222' },
    { amount: '9.500000', submitted: '9.5' },
    { amount: 'gh-5.86bf', submitted: '5.86' }
  ]

  submittedAmounts.forEach((spec) => {
    it(`submits a requested amount of ${spec.amount} as ${spec.submitted}`, async () => {
      const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

      await clearBaseFee()
      await enterBaseFee(spec.amount)

      expect(getBaseFeeInput().value).toBe(spec.submitted)
      expect(link.rpc).toHaveBeenCalledWith(
        'setBaseFee',
        gweiToHex(spec.submitted),
        '1',
        expect.any(Function)
      )
    })
  })

  it('does not submit values when the user is in the middle of typing a float', async () => {
    const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

    await clearBaseFee()
    await enterBaseFee('20.')

    expect(getBaseFeeInput().value).toBe('20.')
    expect(link.rpc).not.toHaveBeenCalled()
  })

  it('does not submit empty values', async () => {
    const { getBaseFeeInput, clearBaseFee } = setupComponent(req)

    await clearBaseFee()

    expect(getBaseFeeInput().value).toBe('')
    expect(link.rpc).not.toHaveBeenCalled()
  })

  it('renders a small fraction of a gwei', async () => {
    const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

    await clearBaseFee()
    await enterBaseFee('0.00000001')

    expect(getBaseFeeInput().value).toBe('0.00000001')
  })

  it('renders a decimal point', async () => {
    const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

    await clearBaseFee()
    await enterBaseFee('.')

    expect(getBaseFeeInput().value).toBe('.')
  })

  it('increments integer values when the up arrow key is pressed', async () => {
    const { getBaseFeeInput, enterBaseFee } = setupComponent(req)

    await enterBaseFee('{ArrowUp}')

    expect(getBaseFeeInput().value).toBe('5')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', gweiToHex(5), '1', expect.any(Function))
  })

  it('increments float values when the up arrow key is pressed', async () => {
    const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

    await clearBaseFee()
    await enterBaseFee('1.5{ArrowUp}')

    expect(getBaseFeeInput().value).toBe('2.5')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', gweiToHex(2.5), '1', expect.any(Function))
  })

  it('does not increment values above the upper limit', async () => {
    const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

    await clearBaseFee()
    await enterBaseFee('9998{ArrowUp}{ArrowUp}{ArrowUp}')

    expect(getBaseFeeInput().value).toBe('9999')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', gweiToHex(9999), '1', expect.any(Function))
  })

  it('decrements integer values when the down arrow key is pressed', async () => {
    const { getBaseFeeInput, enterBaseFee } = setupComponent(req)

    await enterBaseFee('{ArrowDown}')

    expect(getBaseFeeInput().value).toBe('3')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', gweiToHex(3), '1', expect.any(Function))
  })

  it('decrements float values when the down arrow key is pressed', async () => {
    const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

    await clearBaseFee()
    await enterBaseFee('2.5{ArrowDown}')

    expect(getBaseFeeInput().value).toBe('1.5')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', gweiToHex(1.5), '1', expect.any(Function))
  })

  it('does not decrement values below the lower limit', async () => {
    const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

    await clearBaseFee()
    await enterBaseFee('1{ArrowDown}{ArrowDown}{ArrowDown}')

    expect(getBaseFeeInput().value).toBe('0')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', gweiToHex(0), '1', expect.any(Function))
  })

  it('blurs the input when the enter key is pressed', async () => {
    const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

    await clearBaseFee()
    await enterBaseFee('5{Enter}')

    expect(document.activeElement).not.toEqual(getBaseFeeInput())
  })

  it('recalculates the base fee when the total fee exceeds the maximum allowed (ETH-based chains)', async () => {
    req.data.maxPriorityFeePerGas = gweiToHex(300)
    req.data.maxFeePerGas = gweiToHex(600)
    req.data.gasLimit = intToHex(250000)
    req.data.chainId = '0x1'

    const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

    await clearBaseFee()
    await enterBaseFee('7800')

    expect(getBaseFeeInput().value).toBe('7700')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', gweiToHex(7700), '1', expect.any(Function))
  })

  it('recalculates the base fee when the total fee exceeds the maximum allowed (FTM)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((6000e9).toString(16))
    req.data.gasLimit = addHexPrefix((30000000).toString(16))
    req.data.chainId = '0xfa'

    const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

    await clearBaseFee()
    await enterBaseFee('5600')

    expect(getBaseFeeInput().value).toBe('5333.333333333')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', gweiToHex(5333.333333333), '1', expect.any(Function))
  })

  it('recalculates the base fee when the total fee exceeds the maximum allowed (other chains)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((6000e9).toString(16))
    req.data.gasLimit = addHexPrefix((10000000).toString(16))
    req.data.chainId = '0x89'

    const { getBaseFeeInput, clearBaseFee, enterBaseFee } = setupComponent(req)

    await clearBaseFee()
    await enterBaseFee('2100')

    expect(getBaseFeeInput().value).toBe('2000')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', gweiToHex(2000), '1', expect.any(Function))
  })
})

describe('priority fee input', () => {
  const submittedAmounts = [
    { amount: (100e9).toString(), submitted: '9999' },
    { amount: (1e9).toString(), submitted: '9999' },
    { amount: '9.2', submitted: '9.2' },
    { amount: '9.222222222222222', submitted: '9.222222222' },
    { amount: '9.500000', submitted: '9.5' },
    { amount: 'gh-5.86bf', submitted: '5.86' }
  ]

  submittedAmounts.forEach((spec) => {
    it(`submits a requested amount of ${spec.amount} as ${spec.submitted}`, async () => {
      const { getPriorityFeeInput, clearPriorityFee, enterPriorityFee } = setupComponent(req)

      await clearPriorityFee()
      await enterPriorityFee(spec.amount)

      expect(getPriorityFeeInput().value).toBe(spec.submitted)
      expect(link.rpc).toHaveBeenCalledWith(
        'setPriorityFee',
        gweiToHex(spec.submitted),
        '1',
        expect.any(Function)
      )
    })
  })

  it('does not submit values when the user is in the middle of typing a float', async () => {
    const { getPriorityFeeInput, clearPriorityFee, enterPriorityFee } = setupComponent(req)

    await clearPriorityFee()
    await enterPriorityFee('20.')

    expect(getPriorityFeeInput().value).toBe('20.')
    expect(link.rpc).not.toHaveBeenCalled()
  })

  it('does not submit empty values', async () => {
    const { getPriorityFeeInput, clearPriorityFee } = setupComponent(req)

    await clearPriorityFee()

    expect(getPriorityFeeInput().value).toBe('')
    expect(link.rpc).not.toHaveBeenCalled()
  })

  it('increments integer values when the up arrow key is pressed', async () => {
    const { getPriorityFeeInput, enterPriorityFee } = setupComponent(req)

    await enterPriorityFee('{ArrowUp}')

    expect(getPriorityFeeInput().value).toBe('4')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', gweiToHex(4), '1', expect.any(Function))
  })

  it('increments float values when the up arrow key is pressed', async () => {
    const { getPriorityFeeInput, clearPriorityFee, enterPriorityFee } = setupComponent(req)

    await clearPriorityFee()
    await enterPriorityFee('1.5{ArrowUp}')

    expect(getPriorityFeeInput().value).toBe('2.5')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', gweiToHex(2.5), '1', expect.any(Function))
  })

  it('does not increment values above the upper limit', async () => {
    const { getPriorityFeeInput, clearPriorityFee, enterPriorityFee } = setupComponent(req)

    await clearPriorityFee()
    await enterPriorityFee('9998{ArrowUp}{ArrowUp}{ArrowUp}')

    expect(getPriorityFeeInput().value).toBe('9999')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', gweiToHex(9999), '1', expect.any(Function))
  })

  it('decrements integer values when the down arrow key is pressed', async () => {
    const { getPriorityFeeInput, enterPriorityFee } = setupComponent(req)

    await enterPriorityFee('{ArrowDown}')

    expect(getPriorityFeeInput().value).toBe('2')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', gweiToHex(2), '1', expect.any(Function))
  })

  it('decrements float values when the down arrow key is pressed', async () => {
    const { getPriorityFeeInput, clearPriorityFee, enterPriorityFee } = setupComponent(req)

    await clearPriorityFee()
    await enterPriorityFee('2.5{ArrowDown}')

    expect(getPriorityFeeInput().value).toBe('1.5')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', gweiToHex(1.5), '1', expect.any(Function))
  })

  it('does not decrement values below the lower limit', async () => {
    const { getPriorityFeeInput, clearPriorityFee, enterPriorityFee } = setupComponent(req)

    await clearPriorityFee()
    await enterPriorityFee('1{ArrowDown}{ArrowDown}{ArrowDown}')

    expect(getPriorityFeeInput().value).toBe('0')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', gweiToHex(0), '1', expect.any(Function))
  })

  it('blurs the input when the enter key is pressed', async () => {
    const { getPriorityFeeInput, clearPriorityFee, enterPriorityFee } = setupComponent(req)

    await clearPriorityFee()
    await enterPriorityFee('5{Enter}')

    expect(document.activeElement).not.toEqual(getPriorityFeeInput())
  })

  it('recalculates the priority fee when the total fee exceeds the maximum allowed (ETH-based chains)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((300e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((600e9).toString(16))
    req.data.gasLimit = addHexPrefix((250000).toString(16))
    req.data.chainId = '0x1'

    const { getPriorityFeeInput, clearPriorityFee, enterPriorityFee } = setupComponent(req)

    await clearPriorityFee()
    await enterPriorityFee('7800')

    expect(getPriorityFeeInput().value).toBe('7700')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', gweiToHex(7700), '1', expect.any(Function))
  })

  it('recalculates the priority fee when the total fee exceeds the maximum allowed (FTM)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((6000e9).toString(16))
    req.data.gasLimit = addHexPrefix((30000000).toString(16))
    req.data.chainId = '0xfa'

    const { getPriorityFeeInput, clearPriorityFee, enterPriorityFee } = setupComponent(req)

    await clearPriorityFee()
    await enterPriorityFee('5600')

    expect(getPriorityFeeInput().value).toBe('5333.333333333')
    expect(link.rpc).toHaveBeenCalledWith(
      'setPriorityFee',
      gweiToHex(5333.333333333),
      '1',
      expect.any(Function)
    )
  })

  it('recalculates the priority fee when the total fee exceeds the maximum allowed (other chains)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((6000e9).toString(16))
    req.data.gasLimit = addHexPrefix((10000000).toString(16))
    req.data.chainId = '0x89'

    const { getPriorityFeeInput, clearPriorityFee, enterPriorityFee } = setupComponent(req)

    await clearPriorityFee()
    await enterPriorityFee('2100')

    expect(getPriorityFeeInput().value).toBe('2000')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', gweiToHex(2000), '1', expect.any(Function))
  })
})

describe('gas limit input', () => {
  const submittedAmounts = [
    { amount: (100e9).toString(), submitted: '12500000' },
    { amount: (1e9).toString(), submitted: '12500000' },
    { amount: '9.2', submitted: '92' },
    { amount: 'gh-5.86bf', submitted: '586' }
  ]

  submittedAmounts.forEach((spec) => {
    it(`submits a requested amount of ${spec.amount} as ${spec.submitted}`, async () => {
      const { getGasLimitInput, clearGasLimit, enterGasLimit } = setupComponent(req)

      await clearGasLimit()
      await enterGasLimit(spec.amount)

      expect(getGasLimitInput().value).toBe(spec.submitted)
      expect(link.rpc).toHaveBeenCalledWith(
        'setGasLimit',
        intToHex(parseInt(spec.submitted)),
        '1',
        expect.any(Function)
      )
    })
  })

  it('does not submit empty values', async () => {
    const { getGasLimitInput, clearGasLimit } = setupComponent(req)

    await clearGasLimit()

    expect(getGasLimitInput().value).toBe('')
    expect(link.rpc).not.toHaveBeenCalled()
  })

  it('increments values when the up arrow key is pressed', async () => {
    const { getGasLimitInput, enterGasLimit } = setupComponent(req)

    await enterGasLimit('{ArrowUp}')

    expect(getGasLimitInput().value).toBe('26000')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '0x6590', '1', expect.any(Function))
  })

  it('does not increment values above the upper limit', async () => {
    const { getGasLimitInput, clearGasLimit, enterGasLimit } = setupComponent(req)

    await clearGasLimit()
    await enterGasLimit('12499000{ArrowUp}{ArrowUp}{ArrowUp}')

    expect(getGasLimitInput().value).toBe('12500000')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '0xbebc20', '1', expect.any(Function))
  })

  it('decrements values when the down arrow key is pressed', async () => {
    const { getGasLimitInput, enterGasLimit } = setupComponent(req)

    await enterGasLimit('{ArrowDown}')

    expect(getGasLimitInput().value).toBe('24000')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '0x5dc0', '1', expect.any(Function))
  })

  it('does not decrement values below the lower limit', async () => {
    const { getGasLimitInput, clearGasLimit, enterGasLimit } = setupComponent(req)

    await clearGasLimit()
    await enterGasLimit('1000{ArrowDown}{ArrowDown}{ArrowDown}')

    expect(getGasLimitInput().value).toBe('0')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '0x0', '1', expect.any(Function))
  })

  it('blurs the input when the enter key is pressed', async () => {
    const { getGasLimitInput, clearGasLimit, enterGasLimit } = setupComponent(req)

    await clearGasLimit()
    await enterGasLimit('45000{Enter}')

    expect(document.activeElement).not.toEqual(getGasLimitInput())
  })

  it('recalculates the gas limit when the total fee exceeds the maximum allowed (ETH-based chains)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((6000e9).toString(16))
    req.data.chainId = '1'

    const { getGasLimitInput, clearGasLimit, enterGasLimit } = setupComponent(req)

    await clearGasLimit()
    await enterGasLimit('334000')

    expect(getGasLimitInput().value).toBe('333333')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '0x51615', '1', expect.any(Function))
  })

  it('recalculates the gas limit when the total fee exceeds the maximum allowed (FTM)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((22000e9).toString(16))
    req.data.chainId = '250'

    const { getGasLimitInput, clearGasLimit, enterGasLimit } = setupComponent(req)

    await clearGasLimit()
    await enterGasLimit('11364000')

    expect(getGasLimitInput().value).toBe('11363636')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '0xad6534', '1', expect.any(Function))
  })

  it('recalculates the gas limit when the total fee exceeds the maximum allowed (other chains)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((9000e9).toString(16))
    req.data.chainId = '6746754'

    const { getGasLimitInput, clearGasLimit, enterGasLimit } = setupComponent(req)

    await clearGasLimit()
    await enterGasLimit('5556000')

    expect(getGasLimitInput().value).toBe('5555555')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '0x54c563', '1', expect.any(Function))
  })
})

describe('legacy transactions', () => {
  beforeEach(() => {
    req = {
      data: {
        type: '0x0',
        gasLimit: '0x61a8',
        gasPrice: addHexPrefix((7e9).toString(16))
      },
      handlerId: '1'
    }
  })

  it('renders the gas price input', () => {
    const { getGasPriceInput } = setupComponent(req)
    expect(getGasPriceInput().value).toBe('7')
  })

  it('renders the gas limit input', () => {
    const { getGasLimitInput } = setupComponent(req)
    expect(getGasLimitInput().value).toBe('25000')
  })

  describe('gas price input', () => {
    const submittedAmounts = [
      { amount: (100e9).toString(), submitted: '9999' },
      { amount: (1e9).toString(), submitted: '9999' },
      { amount: '9.2', submitted: '9.2' },
      { amount: '9.222222222222222', submitted: '9.222222222' },
      { amount: '9.500000', submitted: '9.5' },
      { amount: 'gh-5.86bf', submitted: '5.86' }
    ]

    submittedAmounts.forEach((spec) => {
      it(`submits a requested amount of ${spec.amount} as ${spec.submitted}`, async () => {
        const { getGasPriceInput, clearGasPrice, enterGasPrice } = setupComponent(req)

        await clearGasPrice()
        await enterGasPrice(spec.amount)

        expect(getGasPriceInput().value).toBe(spec.submitted)
        expect(link.rpc).toHaveBeenCalledWith(
          'setGasPrice',
          gweiToHex(spec.submitted),
          '1',
          expect.any(Function)
        )
      })
    })

    it('does not submit values when the user is in the middle of typing a float', async () => {
      const { getGasPriceInput, clearGasPrice, enterGasPrice } = setupComponent(req)

      await clearGasPrice()
      await enterGasPrice('20.')

      expect(getGasPriceInput().value).toBe('20.')
      expect(link.rpc).not.toHaveBeenCalled()
    })

    it('does not submit empty values', async () => {
      const { getGasPriceInput, clearGasPrice } = setupComponent(req)

      await clearGasPrice()

      expect(getGasPriceInput().value).toBe('')
      expect(link.rpc).not.toHaveBeenCalled()
    })

    it('increments integer values when the up arrow key is pressed', async () => {
      const { getGasPriceInput, enterGasPrice } = setupComponent(req)

      await enterGasPrice('{ArrowUp}')

      expect(getGasPriceInput().value).toBe('8')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', gweiToHex(8), '1', expect.any(Function))
    })

    it('increments float values when the up arrow key is pressed', async () => {
      const { getGasPriceInput, clearGasPrice, enterGasPrice } = setupComponent(req)

      await clearGasPrice()
      await enterGasPrice('1.5{ArrowUp}')

      expect(getGasPriceInput().value).toBe('2.5')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', gweiToHex(2.5), '1', expect.any(Function))
    })

    it('does not increment values above the upper limit', async () => {
      const { getGasPriceInput, clearGasPrice, enterGasPrice } = setupComponent(req)

      await clearGasPrice()
      await enterGasPrice('9998{ArrowUp}{ArrowUp}{ArrowUp}')

      expect(getGasPriceInput().value).toBe('9999')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', gweiToHex(9999), '1', expect.any(Function))
    })

    it('decrements integer values when the down arrow key is pressed', async () => {
      const { getGasPriceInput, enterGasPrice } = setupComponent(req)

      await enterGasPrice('{ArrowDown}')

      expect(getGasPriceInput().value).toBe('6')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', gweiToHex(6), '1', expect.any(Function))
    })

    it('decrements float values when the down arrow key is pressed', async () => {
      const { getGasPriceInput, clearGasPrice, enterGasPrice } = setupComponent(req)

      await clearGasPrice()
      await enterGasPrice('2.5{ArrowDown}')

      expect(getGasPriceInput().value).toBe('1.5')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', gweiToHex(1.5), '1', expect.any(Function))
    })

    it('does not decrement values below the lower limit', async () => {
      const { getGasPriceInput, clearGasPrice, enterGasPrice } = setupComponent(req)

      await clearGasPrice()
      await enterGasPrice('1{ArrowDown}{ArrowDown}{ArrowDown}')

      expect(getGasPriceInput().value).toBe('0')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', gweiToHex(0), '1', expect.any(Function))
    })

    it('blurs the input when the enter key is pressed', async () => {
      const { getGasPriceInput, clearGasPrice, enterGasPrice } = setupComponent(req)

      await clearGasPrice()
      await enterGasPrice('5{Enter}')

      expect(document.activeElement).not.toEqual(getGasPriceInput())
    })

    it('recalculates the gas price when the total fee exceeds the maximum allowed (ETH-based chains)', async () => {
      req.data.gasLimit = addHexPrefix((250000000).toString(16))
      req.data.chainId = '1'

      const { getGasPriceInput, clearGasPrice, enterGasPrice } = setupComponent(req)

      await clearGasPrice()
      await enterGasPrice('9')

      expect(getGasPriceInput().value).toBe('8')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', gweiToHex(8), '1', expect.any(Function))
    })

    it('recalculates the gas price when the total fee exceeds the maximum allowed (FTM)', async () => {
      req.data.gasLimit = addHexPrefix((3000000000).toString(16))
      req.data.chainId = '250'

      const { getGasPriceInput, clearGasPrice, enterGasPrice } = setupComponent(req)

      await clearGasPrice()
      await enterGasPrice('85')

      expect(getGasPriceInput().value).toBe('83.333333333')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', gweiToHex(83.333333333), '1', expect.any(Function))
    })

    it('recalculates the gas price when the total fee exceeds the maximum allowed (other chains)', async () => {
      req.data.gasLimit = addHexPrefix((1000000000).toString(16))
      req.data.chainId = '6746754'

      const { getGasPriceInput, clearGasPrice, enterGasPrice } = setupComponent(req)

      await clearGasPrice()
      await enterGasPrice('51')

      expect(getGasPriceInput().value).toBe('50')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', gweiToHex(50), '1', expect.any(Function))
    })
  })

  describe('gas limit input', () => {
    it('recalculates the gas limit when the total fee exceeds the maximum allowed (ETH-based chains)', async () => {
      req.data.gasPrice = addHexPrefix((250e9).toString(16))
      req.data.chainId = '1'

      const { getGasLimitInput, clearGasLimit, enterGasLimit } = setupComponent(req)

      await clearGasLimit()
      await enterGasLimit('8001000')

      expect(getGasLimitInput().value).toBe('8000000')
      expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '0x7a1200', '1', expect.any(Function))
    })

    it('recalculates the gas limit when the total fee exceeds the maximum allowed (FTM)', async () => {
      req.data.gasPrice = addHexPrefix((87000e9).toString(16))
      req.data.chainId = '250'

      const { getGasLimitInput, clearGasLimit, enterGasLimit } = setupComponent(req)

      await clearGasLimit()
      await enterGasLimit('2874000')

      expect(getGasLimitInput().value).toBe('2873563')
      expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '0x2bd8db', '1', expect.any(Function))
    })

    it('recalculates the gas limit when the total fee exceeds the maximum allowed (other chains)', async () => {
      req.data.gasPrice = addHexPrefix((27000e9).toString(16))
      req.data.chainId = '6746754'

      const { getGasLimitInput, clearGasLimit, enterGasLimit } = setupComponent(req)

      await clearGasLimit()
      await enterGasLimit('1852000')

      expect(getGasLimitInput().value).toBe('1851851')
      expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '0x1c41cb', '1', expect.any(Function))
    })
  })
})

function setupComponent(req) {
  const { user } = render(<AdjustFee req={req} />)

  const getBaseFeeInput = () => screen.getByLabelText('Base Fee (GWEI)')
  const getPriorityFeeInput = () => screen.getByLabelText('Max Priority Fee (GWEI)')
  const getGasLimitInput = () => screen.getByLabelText('Gas Limit (UNITS)')
  const getGasPriceInput = () => screen.getByLabelText('Gas Price (GWEI)')

  return {
    getBaseFeeInput,
    getPriorityFeeInput,
    getGasLimitInput,
    getGasPriceInput,
    clearBaseFee: async () => actAndWait(() => user.clear(getBaseFeeInput()), 500),
    enterBaseFee: async (amount) => actAndWait(() => user.type(getBaseFeeInput(), amount), 500),
    clearPriorityFee: async () => actAndWait(() => user.clear(getPriorityFeeInput()), 500),
    enterPriorityFee: async (amount) => actAndWait(() => user.type(getPriorityFeeInput(), amount), 500),
    clearGasLimit: async () => actAndWait(() => user.clear(getGasLimitInput()), 500),
    enterGasLimit: async (amount) => actAndWait(() => user.type(getGasLimitInput(), amount), 500),
    clearGasPrice: async () => actAndWait(() => user.clear(getGasPriceInput()), 500),
    enterGasPrice: async (amount) => actAndWait(() => user.type(getGasPriceInput(), amount), 500)
  }
}
