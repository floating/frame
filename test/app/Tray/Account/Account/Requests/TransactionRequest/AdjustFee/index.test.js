import React from 'react'
import Restore from 'react-restore'
import { addHexPrefix } from '@ethereumjs/util'
import BigNumber from 'bignumber.js'

import store from '../../../../../../../../main/store'
import link from '../../../../../../../../resources/link'
import { screen, render, advanceTimers } from '../../../../../../../componentSetup'
import AdjustFeeComponent from '../../../../../../../../app/tray/Account/Account/Requests/TransactionRequest/AdjustFee'

jest.mock('../../../../../../../../main/store/persist')
jest.mock('../../../../../../../../resources/link', () => ({ rpc: jest.fn() }))

const hexStr = (val) => `0x${BigNumber(val).times(1e9).toString(16)}`

const AdjustFee = Restore.connect(AdjustFeeComponent, store)
let req

beforeEach(() => {
  req = {
    data: {
      type: '0x2',
      gasLimit: '0x61a8',
      maxPriorityFeePerGas: addHexPrefix((3e9).toString(16)),
      maxFeePerGas: addHexPrefix((7e9).toString(16))
    },
    handlerId: '1'
  }
})

it('renders the base fee input', () => {
  render(<AdjustFee req={req} />)
  const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')
  expect(baseFeeInput.value).toBe('4')
})

it('renders the priority fee input', () => {
  render(<AdjustFee req={req} />)

  const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')
  expect(priorityFeeInput.value).toBe('3')
})

it('renders the gas limit input', () => {
  render(<AdjustFee req={req} />)

  const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')
  expect(gasLimitInput.value).toBe('25000')
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
      const { user } = render(<AdjustFee req={req} />)
      const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

      await user.clear(baseFeeInput)
      await user.type(baseFeeInput, spec.amount)

      advanceTimers(500)

      expect(baseFeeInput.value).toBe(spec.submitted)
      expect(link.rpc).toHaveBeenCalledWith('setBaseFee', hexStr(spec.submitted), '1', expect.any(Function))
    })
  })

  it('does not submit values when the user is in the middle of typing a float', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)
    await user.type(baseFeeInput, '20.')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('20.')
    expect(link.rpc).not.toHaveBeenCalled()
  })

  it('does not submit empty values', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('')
    expect(link.rpc).not.toHaveBeenCalled()
  })

  it('renders a small fraction of a gwei', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)
    await user.type(baseFeeInput, '0.00000001')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('0.00000001')
  })

  it('renders a decimal point', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)
    await user.type(baseFeeInput, '.')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('.')
  })

  it('increments integer values when the up arrow key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.type(baseFeeInput, '{ArrowUp}')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('5')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', hexStr(5), '1', expect.any(Function))
  })

  it('increments float values when the up arrow key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)
    await user.type(baseFeeInput, '1.5{ArrowUp}')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('2.5')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', hexStr(2.5), '1', expect.any(Function))
  })

  it('does not increment values above the upper limit', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)
    await user.type(baseFeeInput, '9998{ArrowUp}{ArrowUp}{ArrowUp}')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('9999')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', hexStr(9999), '1', expect.any(Function))
  })

  it('decrements integer values when the down arrow key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.type(baseFeeInput, '{ArrowDown}')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('3')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', hexStr(3), '1', expect.any(Function))
  })

  it('decrements float values when the down arrow key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)
    await user.type(baseFeeInput, '2.5{ArrowDown}')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('1.5')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', hexStr(1.5), '1', expect.any(Function))
  })

  it('does not decrement values below the lower limit', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)
    await user.type(baseFeeInput, '1{ArrowDown}{ArrowDown}{ArrowDown}')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('0')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', hexStr(0), '1', expect.any(Function))
  })

  it('blurs the input when the enter key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)
    await user.type(baseFeeInput, '5{Enter}')

    expect(document.activeElement).not.toEqual(baseFeeInput)
  })

  it('recalculates the base fee when the total fee exceeds the maximum allowed (ETH-based chains)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((300e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((600e9).toString(16))
    req.data.gasLimit = addHexPrefix((250000).toString(16))
    req.data.chainId = '1'

    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)
    await user.type(baseFeeInput, '7800')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('7700')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', hexStr(7700), '1', expect.any(Function))
  })

  it('recalculates the base fee when the total fee exceeds the maximum allowed (FTM)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((6000e9).toString(16))
    req.data.gasLimit = addHexPrefix((30000000).toString(16))
    req.data.chainId = '250'

    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)
    await user.type(baseFeeInput, '5600')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('5333.333333333')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', hexStr(5333.333333333), '1', expect.any(Function))
  })

  it('recalculates the base fee when the total fee exceeds the maximum allowed (other chains)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((6000e9).toString(16))
    req.data.gasLimit = addHexPrefix((10000000).toString(16))
    req.data.chainId = '6746754'

    const { user } = render(<AdjustFee req={req} />)
    const baseFeeInput = screen.getByLabelText('Base Fee (GWEI)')

    await user.clear(baseFeeInput)
    await user.type(baseFeeInput, '2100')

    advanceTimers(500)

    expect(baseFeeInput.value).toBe('2000')
    expect(link.rpc).toHaveBeenCalledWith('setBaseFee', hexStr(2000), '1', expect.any(Function))
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
      const { user } = render(<AdjustFee req={req} />)
      const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

      await user.clear(priorityFeeInput)
      await user.type(priorityFeeInput, spec.amount)

      advanceTimers(500)

      expect(priorityFeeInput.value).toBe(spec.submitted)
      expect(link.rpc).toHaveBeenCalledWith(
        'setPriorityFee',
        hexStr(spec.submitted),
        '1',
        expect.any(Function)
      )
    })
  })

  it('does not submit values when the user is in the middle of typing a float', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.clear(priorityFeeInput)
    await user.type(priorityFeeInput, '20.')

    advanceTimers(500)

    expect(priorityFeeInput.value).toBe('20.')
    expect(link.rpc).not.toHaveBeenCalled()
  })

  it('does not submit empty values', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.clear(priorityFeeInput)

    advanceTimers(500)

    expect(priorityFeeInput.value).toBe('')
    expect(link.rpc).not.toHaveBeenCalled()
  })

  it('increments integer values when the up arrow key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.type(priorityFeeInput, '{ArrowUp}')

    advanceTimers(500)

    expect(priorityFeeInput.value).toBe('4')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', hexStr(4), '1', expect.any(Function))
  })

  it('increments float values when the up arrow key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.clear(priorityFeeInput)
    await user.type(priorityFeeInput, '1.5{ArrowUp}')

    advanceTimers(500)

    expect(priorityFeeInput.value).toBe('2.5')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', hexStr(2.5), '1', expect.any(Function))
  })

  it('does not increment values above the upper limit', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.clear(priorityFeeInput)
    await user.type(priorityFeeInput, '9998{ArrowUp}{ArrowUp}{ArrowUp}')

    advanceTimers(500)

    expect(priorityFeeInput.value).toBe('9999')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', hexStr(9999), '1', expect.any(Function))
  })

  it('decrements integer values when the down arrow key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.type(priorityFeeInput, '{ArrowDown}')

    advanceTimers(500)

    expect(priorityFeeInput.value).toBe('2')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', hexStr(2), '1', expect.any(Function))
  })

  it('decrements float values when the down arrow key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.clear(priorityFeeInput)
    await user.type(priorityFeeInput, '2.5{ArrowDown}')

    advanceTimers(500)

    expect(priorityFeeInput.value).toBe('1.5')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', hexStr(1.5), '1', expect.any(Function))
  })

  it('does not decrement values below the lower limit', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.clear(priorityFeeInput)
    await user.type(priorityFeeInput, '1{ArrowDown}{ArrowDown}{ArrowDown}')

    advanceTimers(500)

    expect(priorityFeeInput.value).toBe('0')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', hexStr(0), '1', expect.any(Function))
  })

  it('blurs the input when the enter key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.clear(priorityFeeInput)
    await user.type(priorityFeeInput, '5{Enter}')

    expect(document.activeElement).not.toEqual(priorityFeeInput)
  })

  it('recalculates the priority fee when the total fee exceeds the maximum allowed (ETH-based chains)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((300e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((600e9).toString(16))
    req.data.gasLimit = addHexPrefix((250000).toString(16))
    req.data.chainId = '1'

    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.clear(priorityFeeInput)
    await user.type(priorityFeeInput, '7800')

    advanceTimers(500)

    expect(priorityFeeInput.value).toBe('7700')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', hexStr(7700), '1', expect.any(Function))
  })

  it('recalculates the priority fee when the total fee exceeds the maximum allowed (FTM)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((6000e9).toString(16))
    req.data.gasLimit = addHexPrefix((30000000).toString(16))
    req.data.chainId = '250'

    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.clear(priorityFeeInput)
    await user.type(priorityFeeInput, '5600')

    advanceTimers(500)

    expect(priorityFeeInput.value).toBe('5333.333333333')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', hexStr(5333.333333333), '1', expect.any(Function))
  })

  it('recalculates the priority fee when the total fee exceeds the maximum allowed (other chains)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((6000e9).toString(16))
    req.data.gasLimit = addHexPrefix((10000000).toString(16))
    req.data.chainId = '6746754'

    const { user } = render(<AdjustFee req={req} />)
    const priorityFeeInput = screen.getByLabelText('Max Priority Fee (GWEI)')

    await user.clear(priorityFeeInput)
    await user.type(priorityFeeInput, '2100')

    advanceTimers(500)

    expect(priorityFeeInput.value).toBe('2000')
    expect(link.rpc).toHaveBeenCalledWith('setPriorityFee', hexStr(2000), '1', expect.any(Function))
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
      const { user } = render(<AdjustFee req={req} />)
      const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

      await user.clear(gasLimitInput)
      await user.type(gasLimitInput, spec.amount)

      advanceTimers(500)

      expect(gasLimitInput.value).toBe(spec.submitted)
      expect(link.rpc).toHaveBeenCalledWith('setGasLimit', spec.submitted, '1', expect.any(Function))
    })
  })

  it('does not submit empty values', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

    await user.clear(gasLimitInput)

    advanceTimers(500)

    expect(gasLimitInput.value).toBe('')
    expect(link.rpc).not.toHaveBeenCalled()
  })

  it('increments values when the up arrow key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

    await user.type(gasLimitInput, '{ArrowUp}')

    advanceTimers(500)

    expect(gasLimitInput.value).toBe('26000')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '26000', '1', expect.any(Function))
  })

  it('does not increment values above the upper limit', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

    await user.clear(gasLimitInput)
    await user.type(gasLimitInput, '12499000{ArrowUp}{ArrowUp}{ArrowUp}')

    advanceTimers(500)

    expect(gasLimitInput.value).toBe('12500000')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '12500000', '1', expect.any(Function))
  })

  it('decrements values when the down arrow key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

    await user.type(gasLimitInput, '{ArrowDown}')

    advanceTimers(500)

    expect(gasLimitInput.value).toBe('24000')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '24000', '1', expect.any(Function))
  })

  it('does not decrement values below the lower limit', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

    await user.clear(gasLimitInput)
    await user.type(gasLimitInput, '1000{ArrowDown}{ArrowDown}{ArrowDown}')

    advanceTimers(500)

    expect(gasLimitInput.value).toBe('0')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '0', '1', expect.any(Function))
  })

  it('blurs the input when the enter key is pressed', async () => {
    const { user } = render(<AdjustFee req={req} />)
    const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

    await user.clear(gasLimitInput)
    await user.type(gasLimitInput, '45000{Enter}')

    expect(document.activeElement).not.toEqual(gasLimitInput)
  })

  it('recalculates the gas limit when the total fee exceeds the maximum allowed (ETH-based chains)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((6000e9).toString(16))
    req.data.chainId = '1'

    const { user } = render(<AdjustFee req={req} />)
    const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

    await user.clear(gasLimitInput)
    await user.type(gasLimitInput, '334000')

    advanceTimers(500)

    expect(gasLimitInput.value).toBe('333333')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '333333', '1', expect.any(Function))
  })

  it('recalculates the gas limit when the total fee exceeds the maximum allowed (FTM)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((22000e9).toString(16))
    req.data.chainId = '250'

    const { user } = render(<AdjustFee req={req} />)
    const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

    await user.clear(gasLimitInput)
    await user.type(gasLimitInput, '11364000')

    advanceTimers(500)

    expect(gasLimitInput.value).toBe('11363636')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '11363636', '1', expect.any(Function))
  })

  it('recalculates the gas limit when the total fee exceeds the maximum allowed (other chains)', async () => {
    req.data.maxPriorityFeePerGas = addHexPrefix((3000e9).toString(16))
    req.data.maxFeePerGas = addHexPrefix((9000e9).toString(16))
    req.data.chainId = '6746754'

    const { user } = render(<AdjustFee req={req} />)
    const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

    await user.clear(gasLimitInput)
    await user.type(gasLimitInput, '5556000')

    advanceTimers(500)

    expect(gasLimitInput.value).toBe('5555555')
    expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '5555555', '1', expect.any(Function))
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
    render(<AdjustFee req={req} />)

    const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')
    expect(gasPriceInput.value).toBe('7')
  })

  it('renders the gas limit input', () => {
    render(<AdjustFee req={req} />)

    const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')
    expect(gasLimitInput.value).toBe('25000')
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
        const { user } = render(<AdjustFee req={req} />)
        const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

        await user.clear(gasPriceInput)
        await user.type(gasPriceInput, spec.amount)

        advanceTimers(500)

        expect(gasPriceInput.value).toBe(spec.submitted)
        expect(link.rpc).toHaveBeenCalledWith(
          'setGasPrice',
          hexStr(spec.submitted),
          '1',
          expect.any(Function)
        )
      })
    })

    it('does not submit values when the user is in the middle of typing a float', async () => {
      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.clear(gasPriceInput)
      await user.type(gasPriceInput, '20.')

      advanceTimers(500)

      expect(gasPriceInput.value).toBe('20.')
      expect(link.rpc).not.toHaveBeenCalled()
    })

    it('does not submit empty values', async () => {
      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.clear(gasPriceInput)

      advanceTimers(500)

      expect(gasPriceInput.value).toBe('')
      expect(link.rpc).not.toHaveBeenCalled()
    })

    it('increments integer values when the up arrow key is pressed', async () => {
      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.type(gasPriceInput, '{ArrowUp}')

      advanceTimers(500)

      expect(gasPriceInput.value).toBe('8')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', hexStr(8), '1', expect.any(Function))
    })

    it('increments float values when the up arrow key is pressed', async () => {
      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.clear(gasPriceInput)
      await user.type(gasPriceInput, '1.5{ArrowUp}')

      advanceTimers(500)

      expect(gasPriceInput.value).toBe('2.5')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', hexStr(2.5), '1', expect.any(Function))
    })

    it('does not increment values above the upper limit', async () => {
      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.clear(gasPriceInput)
      await user.type(gasPriceInput, '9998{ArrowUp}{ArrowUp}{ArrowUp}')

      advanceTimers(500)

      expect(gasPriceInput.value).toBe('9999')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', hexStr(9999), '1', expect.any(Function))
    })

    it('decrements integer values when the down arrow key is pressed', async () => {
      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.type(gasPriceInput, '{ArrowDown}')

      advanceTimers(500)

      expect(gasPriceInput.value).toBe('6')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', hexStr(6), '1', expect.any(Function))
    })

    it('decrements float values when the down arrow key is pressed', async () => {
      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.clear(gasPriceInput)
      await user.type(gasPriceInput, '2.5{ArrowDown}')

      advanceTimers(500)

      expect(gasPriceInput.value).toBe('1.5')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', hexStr(1.5), '1', expect.any(Function))
    })

    it('does not decrement values below the lower limit', async () => {
      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.clear(gasPriceInput)
      await user.type(gasPriceInput, '1{ArrowDown}{ArrowDown}{ArrowDown}')

      advanceTimers(500)

      expect(gasPriceInput.value).toBe('0')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', hexStr(0), '1', expect.any(Function))
    })

    it('blurs the input when the enter key is pressed', async () => {
      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.clear(gasPriceInput)
      await user.type(gasPriceInput, '5{Enter}')

      expect(document.activeElement).not.toEqual(gasPriceInput)
    })

    it('recalculates the gas price when the total fee exceeds the maximum allowed (ETH-based chains)', async () => {
      req.data.gasLimit = addHexPrefix((250000000).toString(16))
      req.data.chainId = '1'

      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.clear(gasPriceInput)
      await user.type(gasPriceInput, '9')

      advanceTimers(500)

      expect(gasPriceInput.value).toBe('8')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', hexStr(8), '1', expect.any(Function))
    })

    it('recalculates the gas price when the total fee exceeds the maximum allowed (FTM)', async () => {
      req.data.gasLimit = addHexPrefix((3000000000).toString(16))
      req.data.chainId = '250'

      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.clear(gasPriceInput)
      await user.type(gasPriceInput, '85')

      advanceTimers(500)

      expect(gasPriceInput.value).toBe('83.333333333')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', hexStr(83.333333333), '1', expect.any(Function))
    })

    it('recalculates the gas price when the total fee exceeds the maximum allowed (other chains)', async () => {
      req.data.gasLimit = addHexPrefix((1000000000).toString(16))
      req.data.chainId = '6746754'

      const { user } = render(<AdjustFee req={req} />)
      const gasPriceInput = screen.getByLabelText('Gas Price (GWEI)')

      await user.clear(gasPriceInput)
      await user.type(gasPriceInput, '51')

      advanceTimers(500)

      expect(gasPriceInput.value).toBe('50')
      expect(link.rpc).toHaveBeenCalledWith('setGasPrice', hexStr(50), '1', expect.any(Function))
    })
  })

  describe('gas limit input', () => {
    it('recalculates the gas limit when the total fee exceeds the maximum allowed (ETH-based chains)', async () => {
      req.data.gasPrice = addHexPrefix((250e9).toString(16))
      req.data.chainId = '1'

      const { user } = render(<AdjustFee req={req} />)
      const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

      await user.clear(gasLimitInput)
      await user.type(gasLimitInput, '8001000')

      advanceTimers(500)

      expect(gasLimitInput.value).toBe('8000000')
      expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '8000000', '1', expect.any(Function))
    })

    it('recalculates the gas limit when the total fee exceeds the maximum allowed (FTM)', async () => {
      req.data.gasPrice = addHexPrefix((87000e9).toString(16))
      req.data.chainId = '250'

      const { user } = render(<AdjustFee req={req} />)
      const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

      await user.clear(gasLimitInput)
      await user.type(gasLimitInput, '2874000')

      advanceTimers(500)

      expect(gasLimitInput.value).toBe('2873563')
      expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '2873563', '1', expect.any(Function))
    })

    it('recalculates the gas limit when the total fee exceeds the maximum allowed (other chains)', async () => {
      req.data.gasPrice = addHexPrefix((27000e9).toString(16))
      req.data.chainId = '6746754'

      const { user } = render(<AdjustFee req={req} />)
      const gasLimitInput = screen.getByLabelText('Gas Limit (UNITS)')

      await user.clear(gasLimitInput)
      await user.type(gasLimitInput, '1852000')

      advanceTimers(500)

      expect(gasLimitInput.value).toBe('1851851')
      expect(link.rpc).toHaveBeenCalledWith('setGasLimit', '1851851', '1', expect.any(Function))
    })
  })
})
