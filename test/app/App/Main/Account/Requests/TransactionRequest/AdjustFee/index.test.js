import React from 'react'
import Restore from 'react-restore'
import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util'

import store from '../../../../../../../../main/store'
import link from '../../../../../../../../resources/link'
import { setupComponent } from '../../../../../../../componentSetup'
import AdjustFeeComponent from '../../../../../../../../app/App/Main/Account/Requests/TransactionRequest/AdjustFee'

jest.mock('../../../../../../../../main/store/persist')
jest.mock('../../../../../../../../resources/link', () => ({ rpc: jest.fn() }))

const AdjustFee = Restore.connect(AdjustFeeComponent, store)
let req

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

beforeEach(() => {
  req = { 
    data: { 
      type: '0x2',
      gasLimit: '0x61a8',
      maxPriorityFeePerGas: addHexPrefix(3e9.toString(16)),
      maxFeePerGas: addHexPrefix(7e9.toString(16)),
      handlerId: '1' 
    }
  }
})

it('renders the base fee input', () => {
  const { getByLabelText, debug } = setupComponent(<AdjustFee req={req} />)

  debug()   
  const baseFeeInput = getByLabelText('Base Fee (GWEI)')
  expect(baseFeeInput.value).toBe('4')
})

it('renders the priority fee input', () => {
  const { getByLabelText } = setupComponent(<AdjustFee req={req} />)

  const priorityFeeInput = getByLabelText('Max Priority Fee (GWEI)')
  expect(priorityFeeInput.value).toBe('3')
})

it('renders the gas limit input', () => {
  const { getByLabelText } = setupComponent(<AdjustFee req={req} />)
  
  const gasLimitInput = getByLabelText('Gas Limit (UNITS)')
  expect(gasLimitInput.value).toBe('25000')
})

describe('base fee input submitting values', () => {
  const submittedAmounts = [
    { amount: 100e9.toString(), submitted: '9999' },
    { amount: 1e9.toString(), submitted: '9999' },
    { amount: '9.2', submitted: '9.2' },
    { amount: '9.222222222222222', submitted: '9.222222222' },
    { amount: '9.500000', submitted: '9.5' },
    { amount: 'gh-5.86bf', submitted: '5.86' },
  ]

  submittedAmounts.forEach((spec) => {
    it(`submits a requested amount of ${spec.amount} as ${spec.submitted}`, async () => {
      const { user, getByLabelText } = setupComponent(<AdjustFee req={req} />)
      const baseFeeInput = getByLabelText('Base Fee (GWEI)')

      await user.type(baseFeeInput, spec.amount)
      
      jest.advanceTimersByTime(500)

      expect(baseFeeInput.value).toBe(spec.submitted)
      expect(link.rpc).toHaveBeenCalledWith(spec.submitted)
    })
  })

  it('does not submit values when the user is in the middle of typing a float', async () => {
    const { user, getByLabelText } = setupComponent(<AdjustFee req={req} />)
    const baseFeeInput = getByLabelText('Base Fee (GWEI)')

    await user.type(baseFeeInput, '20.')
    
    jest.advanceTimersByTime(500)

    expect(baseFeeInput.value).toBe('20.')
    expect(link.rpc).not.toHaveBeenCalled()
  })
})

describe('legacy transactions', () => {
  beforeEach(() => {
    req = { 
      data: { 
        type: '0x0',
        gasLimit: '0x61a8',
        gasPrice: addHexPrefix(7e9.toString(16)),
        handlerId: '1' 
      }
    }
  })

  it('renders the gas price input', () => {
    const { getByLabelText } = setupComponent(<AdjustFee req={req} />)
        
    const gasPriceInput = getByLabelText('Gas Price (GWEI)')
    expect(gasPriceInput.value).toBe('7')
  })

  it('renders the gas limit input', () => {
    const { getByLabelText } = setupComponent(<AdjustFee req={req} />)
        
    const gasLimitInput = getByLabelText('Gas Limit (UNITS)')
    expect(gasLimitInput.value).toBe('25000')
  })
})

