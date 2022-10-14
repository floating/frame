import React from 'react'
import Restore from 'react-restore'
import { addHexPrefix } from 'ethereumjs-util'

import store from '../../../../../../../../main/store'
import { setupComponent } from '../../../../../../../componentSetup'
import TxFeeComponent from '../../../../../../../../app/App/Account/Account/Requests/TransactionRequest/TxFeeNew'
import { GasFeesSource } from '../../../../../../../../resources/domain/transaction'

jest.mock('../../../../../../../../main/store/persist')
jest.mock('../../../../../../../../resources/link', () => ({ rpc: jest.fn() }))

const TxFee = Restore.connect(TxFeeComponent, store)
let req

beforeEach(() => {
  store.setNativeCurrencyData('ethereum', 137, { usd: { price: 0.86 } })

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
  
    const formattedString = getFormattedString(baseFeeInput.textContent, ['G'])
    expect(formattedString).toBe('10 Gwei')
  })
  
  it('renders a total gas price of gwei with decimals', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix(12369e6.toString(16))
  
    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('gas-display')
  
    const formattedString = getFormattedString(baseFeeInput.textContent, ['G'])
    expect(formattedString).toBe('12.369 Gwei')
  })
  
  it('renders a total gas price of less than 1 million wei', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix(945e3.toString(16))
  
    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('gas-display')
  
    const formattedString = getFormattedString(baseFeeInput.textContent, ['W'])
    expect(formattedString).toBe('945,000 Wei')
  })
})

describe('usd estimate display', () => {
  it('renders an estimate for less than a cent', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix(1e10.toString(16))
  
    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('usd-estimate-display')
  
    const formattedString = getFormattedString(baseFeeInput.textContent, ['<', 'i'])
    expect(formattedString).toBe('≈ < $0.01 in MATIC')
  })

  it('renders an estimate for between less than a cent and one cent', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix(5e11.toString(16))
  
    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('usd-estimate-display')
  
    const formattedString = getFormattedString(baseFeeInput.textContent, ['<', 'i'])
    expect(formattedString).toBe('≈ < $0.01-$0.01 in MATIC')
  })

  it('renders an estimate for between > $1 values', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix(5e14.toString(16))
  
    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('usd-estimate-display')
  
    const formattedString = getFormattedString(baseFeeInput.textContent, ['$', 'i'])
    expect(formattedString).toBe('≈ $5.88-$11.18 in MATIC')
  })

  it('renders a warning when the estimate is over the fee threshold', () => {
    req.data.type = '0x0'
    req.data.gasPrice = addHexPrefix(5e16.toString(16))
  
    const { getByTestId } = setupComponent(<TxFee req={req} />)
    const baseFeeInput = getByTestId('usd-estimate-display')
  
    expect(baseFeeInput.children[0].classList.contains('_txFeeValueDefaultWarn')).toBe(true)
  })
})

function getFormattedString (textValue, splitValues) {
  let newTextValue = textValue
  splitValues.forEach((splitValue) => {
    newTextValue = newTextValue.replace(splitValue, ` ${splitValue}`)
  })
  return newTextValue
}
