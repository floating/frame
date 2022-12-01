import React from 'react'
import Restore from 'react-restore'
import { addHexPrefix } from '@ethereumjs/util'

import store from '../../../../../../../../main/store'
import { setupComponent } from '../../../../../../../componentSetup'
import TxFeeComponent from '../../../../../../../../app/App/Account/Account/Requests/TransactionRequest/TxFeeNew'
import { GasFeesSource } from '../../../../../../../../resources/domain/transaction'

jest.mock('../../../../../../../../main/store/persist')
jest.mock('../../../../../../../../resources/link', () => ({ rpc: jest.fn() }))

const TxFee = Restore.connect(TxFeeComponent, store)
let req

beforeEach(() => {
  store.setNativeCurrencyData('ethereum', 137, { usd: { symbol: 'MATIC', price: 0.86 }})

  req = {
    feesUpdatedByUser: false,
    data: {
      chainId: '0x89',
      type: '0x2',
      gasLimit: addHexPrefix((26000).toString(16)),
      gasPrice: addHexPrefix(10e9.toString(16)),
      maxPriorityFeePerGas: addHexPrefix(3e9.toString(16)),
      maxFeePerGas: addHexPrefix(7e9.toString(16)),
      gasFeesSource: GasFeesSource.Frame
    }
  }
})

describe('gas display', () => {
  it('renders a total gas price of whole-number gwei', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix(1e10.toString(16))

    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('gas-display')

    expect(baseFeeInput.textContent).toBe('10Gwei')
  })
  
  it('renders a total gas price of gwei with decimals', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix(12369e6.toString(16))
  
    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('gas-display')

    expect(baseFeeInput.textContent).toBe('12.369Gwei')
  })

  it('renders a total gas price of more than 1 thousand wei in gwei', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix((945e3).toString(16))

    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('gas-display')

    expect(baseFeeInput.textContent).toBe('0.000945Gwei')
  })

  it('renders a total gas price of less than 1 thousand wei', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix((945).toString(16))
  
    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('gas-display')
  
    expect(baseFeeInput.textContent).toBe('945Wei')
  })
})

describe('usd estimate display', () => {
  it('renders an estimate for less than a cent', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix(1e10.toString(16))
  
    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('usd-estimate-display')

    expect(baseFeeInput.textContent).toBe('≈<$0.01in MATIC')
  })

  it('renders an estimate for between less than a cent and one cent', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix(5e11.toString(16))
  
    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('usd-estimate-display')

    expect(baseFeeInput.textContent).toBe('≈<$0.01-$0.01in MATIC')
  })

  it('renders an estimate for between > $1 values', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix(5e14.toString(16))
  
    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('usd-estimate-display')
  
    expect(baseFeeInput.textContent).toBe('≈$5.88-$11.18in MATIC')
  })
})
