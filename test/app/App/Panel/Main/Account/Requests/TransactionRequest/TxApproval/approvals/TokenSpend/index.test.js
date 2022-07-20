import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { addHexPrefix } from 'ethereumjs-util'

import Restore from 'react-restore'
import store from '../../../../../../../../../../../main/store'
import ApproveTokenSpendComponent from '../../../../../../../../../../../app/App/Panel/Main/Account/Requests/TransactionRequest/TxApproval/approvals/TokenSpend'
import { ApprovalType } from '../../../../../../../../../../../resources/constants'

jest.mock('../../../../../../../../../../../main/store/persist')

const TokenSpend = Restore.connect(ApproveTokenSpendComponent, store)

it('allows the user to reject an approval', done => {
  const onApprove = () => done('should not have approved!')

  const { queryByRole } = render(
    <TokenSpend
      onApprove={onApprove}
      onDecline={done}
      approval={{ data: { decimals: 6, amount: addHexPrefix(100e6.toString(16)) } }} 
    />
  )

  const reject = queryByRole('button', { name: 'Reject' })
  fireEvent.click(reject)
})

it('allows the user to proceed', done => {
  const onApprove = function (req, approvalType, data) {
    try {
      expect(approvalType).toBe(ApprovalType.TokenSpendApproval)

      // 100 * 1e6 to account for decimals
      expect(data.amount).toBe('0x5f5e100')
      done()
    } catch (e) { done(e) }
  }

  const { queryByRole } = render(<TokenSpend onApprove={onApprove} approval={{ data: { decimals: 6, amount: addHexPrefix(100e6.toString(16)) } }} />)

  const proceed = queryByRole('button', { name: 'Proceed' })
  fireEvent.click(proceed)
})

it('should render the expected HTML', () => {
  const tokenSpend = render(
    <TokenSpend
      onApprove={() => {}}
      onDecline={() => {}}
      approval={{ data: { decimals: 6, amount: addHexPrefix(100e6.toString(16)) } }} 
    />
  )
  expect(tokenSpend.container).toMatchSnapshot()
})

describe('revoking an approval', () => {
  it('allows the user to reject a revocation approval', done => {
    const onApprove = () => done('should not have approved!')

    const { queryByRole } = render(
      <TokenSpend
        onApprove={onApprove}
        onDecline={done}
        approval={{ data: { decimals: 6, amount: '0x00' } }} 
        revoke
      />
    )

    const reject = queryByRole('button', { name: 'Reject' })
    fireEvent.click(reject)
  })

  it('allows the user to proceed', done => {
    const onApprove = function (req, approvalType, data) {
      try {
        expect(approvalType).toBe(ApprovalType.TokenSpendRevocation)

        // 100 * 1e6 to account for decimals
        expect(data.amount).toBe('0x0')
        done()
      } catch (e) { done(e) }
    }

    const { queryByRole } = render(
      <TokenSpend
        onApprove={onApprove}
        approval={{ data: { decimals: 6, amount: '0x00' } }} 
        revoke
      />
    )

    const proceed = queryByRole('button', { name: 'Proceed' })
    fireEvent.click(proceed)
  })

  it('should render the expected HTML', () => {
    const tokenSpend = render(
      <TokenSpend
        onApprove={() => {}}
        onDecline={() => {}}
        approval={{ data: { decimals: 6, amount: '0x00' } }} 
        revoke
      />
    )
    expect(tokenSpend.container).toMatchSnapshot()
  })
})

describe('changing approval amounts', () => {
  it('allows the user to set the token approval to a custom amount', async () => {
    return new Promise(async (resolve, reject) => {
      const onApprove = function (req, approvalType, data) {
        try {
          expect(approvalType).toBe(ApprovalType.TokenSpendApproval)

          // 50 * 1e6 to account for decimals
          expect(data.amount).toBe('0x2faf080')
          resolve()
        } catch (e) { reject(e) }
      }

      const { queryByRole } = render(
        <TokenSpend
          onApprove={onApprove}
          approval={{
            data: {
              symbol: 'aUSDC',
              name: 'Aave USDC',
              decimals: 6,
              amount: addHexPrefix(100e6.toString(16))
            }
          }}
        />
      )

      const edit = queryByRole('button', { name: 'Edit' })
      fireEvent.click(edit)

      const custom = queryByRole('button', { name: 'Custom' })
      fireEvent.click(custom)

      const enterAmount = queryByRole('textbox', { name: 'Custom Amount' })
      fireEvent.change(enterAmount, { target: { value: '50' } })

      const proceed = queryByRole('button', { name: 'Proceed' })
      fireEvent.click(proceed)
    })
  })

  it('does not allows the user to set the token approval to a custom amount for an unknown token', async () => {
    return new Promise(async (resolve, reject) => {
      const onApprove = function (req, approvalType, data) {
        try {
          expect(approvalType).toBe(ApprovalType.TokenSpendApproval)

          // 50 * 1e6 to account for decimals
          expect(data.amount).toBe('0x2faf080')
          resolve()
        } catch (e) { reject(e) }
      }

      const { queryByRole } = render(
        <TokenSpend
          onApprove={onApprove}
          approval={{
            data: {
              symbol: 'aUSDC',
              name: 'Aave USDC',
              decimals: 6,
              amount: addHexPrefix(100e6.toString(16))
            }
          }}
        />
      )

      const edit = queryByRole('button', { name: 'Edit' })
      fireEvent.click(edit)

      const custom = queryByRole('button', { name: 'Custom' })
      fireEvent.click(custom)

      const enterAmount = queryByRole('textbox', { name: 'Custom Amount' })
      fireEvent.change(enterAmount, { target: { value: '50' } })

      const proceed = queryByRole('button', { name: 'Proceed' })
      fireEvent.click(proceed)
    })
  })

  it('allows the user to set the token approval to unlimited', done => {
    const onApprove = function (req, approvalType, data) {
      try {
        expect(approvalType).toBe(ApprovalType.TokenSpendApproval)
        expect(data.amount).toBe('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
        done()
      } catch (e) { done(e) }
    }

    const { queryByRole } = render(<TokenSpend onApprove={onApprove} approval={{ data: { amount: addHexPrefix(100e6.toString(16)) } }} />)

    const edit = queryByRole('button', { name: 'Edit' })
    fireEvent.click(edit)

    const setUnlimited = queryByRole('button', { name: 'Unlimited' })
    fireEvent.click(setUnlimited)

    const proceed = queryByRole('button', { name: 'Proceed' })
    fireEvent.click(proceed)
  })

  it('allows the user to revert the token approval back to the original amount when no decimal data is present', done => {
    const onApprove = function (req, approvalType, data) {
      try {
        expect(approvalType).toBe(ApprovalType.TokenSpendApproval)

        // 50 * 1e6 to account for decimals
        expect(data.amount).toBe('0x2faf080')
        done()
      } catch (e) { done(e) }
    }

    const { queryByRole } = render(<TokenSpend onApprove={onApprove} approval={{ data: { amount: addHexPrefix(50e6.toString(16)) } }} />)

    const edit = queryByRole('button', { name: 'Edit' })
    fireEvent.click(edit)

    const setUnlimited = queryByRole('button', { name: 'Unlimited' })
    fireEvent.click(setUnlimited)

    const setRequested = queryByRole('button', { name: 'Requested' })
    fireEvent.click(setRequested)

    const proceed = queryByRole('button', { name: 'Proceed' })
    fireEvent.click(proceed)
  })

  it('allows the user to revert the token approval back to the original request', done => {
    const onApprove = function (req, approvalType, data) {
      try {
        expect(approvalType).toBe(ApprovalType.TokenSpendApproval)

        // 100 * 1e6 to account for decimals
        expect(data.amount).toBe('0x5f5e100')
        done()
      } catch (e) { done(e) }
    }

    const { queryByRole } = render(
      <TokenSpend
        onApprove={onApprove}
        approval={{
          data: {
            symbol: 'aUSDC',
            name: 'Aave USDC',
            decimals: 6,
            amount: addHexPrefix(100e6.toString(16))
          }
        }} 
      />
    )

    const edit = queryByRole('button', { name: 'Edit' })
    fireEvent.click(edit)

    const custom = queryByRole('button', { name: 'Custom' })
    fireEvent.click(custom)

    const enterAmount = queryByRole('textbox', { name: 'Custom Amount' })
    fireEvent.change(enterAmount, { target: { value: '50' } })

    const requested = queryByRole('button', { name: 'Requested' })
    fireEvent.click(requested)

    const proceed = queryByRole('button', { name: 'Proceed' })
    fireEvent.click(proceed)
  })

  const requiredApprovalData = ['decimals', 'symbol', 'name']

  requiredApprovalData.forEach(field => {
    it(`does not allow the user to edit the amount if ${field} is not present in approval data`, () => {
      const data = {
        symbol: 'aUSDC',
        name: 'Aave USDC',
        decimals: 6,
        amount: addHexPrefix(100e6.toString(16))
      }

      delete data[field]

      const { queryByRole } = render(<TokenSpend approval={{ data }} />)

      const edit = queryByRole('button', { name: 'Edit' })
      fireEvent.click(edit)

      const custom = queryByRole('button', { name: 'Custom' })
      expect(custom).toBeNull()

      const requestedAmount = queryByRole('textbox')
      const children = requestedAmount.querySelectorAll('div')
      const displayedContent = [...children].map(c => c.textContent).join(' ').trim()

      expect(displayedContent).toBe(data.decimals ? '100' : '100 million')

      // ensure click on requested amount textbox doesn't allow user to enter a custom amount
      fireEvent.click(requestedAmount)
      expect(queryByRole('textbox', { name: 'Custom Amount' })).toBeNull()
    })
  })
})

describe('formatting amounts', () => {
  const formattedAmounts = [
    { amount: 1e5, formatted: '100000' },
    { amount: 92e5, formatted: '9.2 million' },
    { amount: 100e9, formatted: '100 billion' },
    { amount: 2e12, formatted: '2 trillion' },
    { amount: 1e13, formatted: '~unlimited' }
  ]

  formattedAmounts.forEach(spec => {
    it(`formats a requested amount of ${spec.amount} as ${spec.formatted}`, () => {
      const { queryByRole } = render(
        <TokenSpend
          approval={{
            data: {
              symbol: 'aUSDC',
              name: 'Aave USDC',
              decimals: 6,
              amount: addHexPrefix((spec.amount * 1e6).toString(16))
            }
          }} 
        />
      )

      const edit = queryByRole('button', { name: 'Edit' })
      fireEvent.click(edit)

      const requestedAmount = queryByRole('textbox')
      const children = requestedAmount.querySelectorAll('div')
      const displayedContent = [...children].map(c => c.textContent).join(' ').trim()

      expect(displayedContent).toBe(spec.formatted)
    })
  })
})
