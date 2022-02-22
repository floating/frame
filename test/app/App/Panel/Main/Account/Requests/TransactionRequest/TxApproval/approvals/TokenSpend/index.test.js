import React from 'react'
import { render } from '@testing-library/react'

import Restore from 'react-restore'
import store from '../../../../../../../../../../../main/store'
import ApproveTokenSpendComponent from '../../../../../../../../../../../app/App/Panel/Main/Account/Requests/TransactionRequest/TxApproval/approvals/TokenSpend'

jest.mock('../../../../../../../../../../../main/store/persist', () => ({
  get: jest.fn(),
  set: jest.fn(),
  queue: jest.fn()
}))

const TokenSpend = Restore.connect(ApproveTokenSpendComponent, store)

it('renders a reject button', () => {
  const { queryByRole } = render(<TokenSpend approval={{ data: { decimals: 6, amount: 100 } }} />)

  const reject = queryByRole('button', { name: 'Reject' })
  expect(reject).not.toBe(null)
})

it('renders an approve button', () => {
  const { queryByRole } = render(<TokenSpend approval={{ data: { decimals: 6, amount: 100 } }} />)  

  const reject = queryByRole('button', { name: 'Proceed' })
  expect(reject).not.toBe(null)
})
