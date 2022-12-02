import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { addHexPrefix } from '@ethereumjs/util'

import Restore from 'react-restore'
import store from '../../../../../../../../../../../main/store'
import ApproveTokenSpendComponent from '../../../../../../../../../../../app/App/Account/Account/Requests/TransactionRequest/TokenSpend'

jest.mock('../../../../../../../../../../../main/store/persist')

const TokenSpend = Restore.connect(ApproveTokenSpendComponent, store)

describe('changing approval amounts', () => {
  it('allows the user to set the token approval to a custom amount', async () => {
    return new Promise(async (resolve, reject) => {
      const requestedAmountHex = '0x011170'
      const approval = {
        id: 'erc20:approve',
        data: {
          spender: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
          amount: requestedAmountHex,
          decimals: 4,
          name: 'TST',
          symbol: 'TST',
          spenderEns: '',
          spenderType: 'external',
          contract: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698'
        }
      }

      const { queryByRole, getByText } = render(
        <TokenSpend
          approval={approval}
          requestedAmountHex={requestedAmountHex}
          updateApproval={(amount) => {
            try {
              expect(amount).toBe('0x7a120')
              resolve()
            } catch (e) {
              reject(e)
            }
          }}
        />
      )

      const custom = queryByRole('button', { name: 'Custom' })
      fireEvent.click(custom)

      const enterAmount = queryByRole('textbox', { name: 'Custom Amount' })
      fireEvent.change(enterAmount, { target: { value: '50' } })

      const updateCustom = getByText('update')
      fireEvent.click(updateCustom)
    })
  })

  it('does not allows the user to set the token approval to a custom amount for an unknown token', () => {
    const requestedAmountHex = addHexPrefix((100e6).toString(16))

    const approval = {
      id: 'erc20:approve',
      data: {
        spender: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
        amount: requestedAmountHex,
        decimals: 6,
        symbol: 'aUSDC',
        spenderEns: '',
        spenderType: 'external',
        contract: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698'
      }
    }

    const { queryByRole, getByText } = render(
      <TokenSpend approval={approval} requestedAmountHex={requestedAmountHex} updateApproval={() => {}} />
    )

    const custom = queryByRole('button', { name: 'Custom' })
    expect(custom).toBe(null)
  })

  it('allows the user to set the token approval to unlimited', async () => {
    return new Promise(async (resolve, reject) => {
      const requestedAmountHex = '0x011170'

      const approval = {
        id: 'erc20:approve',
        data: {
          spender: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
          amount: requestedAmountHex,
          decimals: 4,
          name: 'TST',
          symbol: 'TST',
          spenderEns: '',
          spenderType: 'external',
          contract: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698'
        }
      }

      const { queryByRole, getByText } = render(
        <TokenSpend
          approval={approval}
          requestedAmountHex={requestedAmountHex}
          updateApproval={(amount) => {
            try {
              expect(amount).toBe('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
              resolve()
            } catch (e) {
              reject(e)
            }
          }}
        />
      )

      const custom = queryByRole('button', { name: 'Custom' })
      fireEvent.click(custom)

      const setUnlimited = queryByRole('button', { name: 'Unlimited' })
      fireEvent.click(setUnlimited)
    })
  })

  it('allows the user to revert the token approval back to the original amount when no decimal data is present', async () => {
    return new Promise(async (resolve, reject) => {
      const requestedAmountHex = '0x011170'

      const approval = {
        id: 'erc20:approve',
        data: {
          spender: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
          amount: requestedAmountHex,
          name: 'TST',
          symbol: 'TST',
          spenderEns: '',
          spenderType: 'external',
          contract: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698'
        }
      }

      const { queryByRole, getByText } = render(
        <TokenSpend
          approval={approval}
          requestedAmountHex={requestedAmountHex}
          updateApproval={(amount) => {
            try {
              if (amount === '0x011170') resolve()
            } catch (e) {
              reject(e)
            }
          }}
        />
      )

      const setUnlimited = queryByRole('button', { name: 'Unlimited' })
      fireEvent.click(setUnlimited)

      const setRequested = queryByRole('button', { name: 'Requested' })
      fireEvent.click(setRequested)
    })
  })

  it('allows the user to revert the token approval back to the original request', async () => {
    return new Promise(async (resolve, reject) => {
      const requestedAmountHex = '0x011170'

      const approval = {
        id: 'erc20:approve',
        data: {
          spender: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
          amount: requestedAmountHex,
          decimals: 4,
          name: 'TST',
          symbol: 'TST',
          spenderEns: '',
          spenderType: 'external',
          contract: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698'
        }
      }

      const { queryByRole, getByText } = render(
        <TokenSpend
          approval={approval}
          requestedAmountHex={requestedAmountHex}
          updateApproval={(amount) => {
            try {
              if (amount === '0x011170') resolve()
            } catch (e) {
              reject(e)
            }
          }}
        />
      )

      const setUnlimited = queryByRole('button', { name: 'Unlimited' })
      fireEvent.click(setUnlimited)

      const setRequested = queryByRole('button', { name: 'Requested' })
      fireEvent.click(setRequested)
    })
  })

  const requiredApprovalData = ['decimals', 'symbol', 'name']

  requiredApprovalData.forEach((field) => {
    it(`does not allow the user to edit the amount if ${field} is not present in approval data`, () => {
      const requestedAmountHex = addHexPrefix((100e6).toString(16))
      const approval = {
        id: 'erc20:approve',
        data: {
          spender: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
          amount: requestedAmountHex,
          decimals: 6,
          name: 'TST',
          symbol: 'TST',
          spenderEns: '',
          spenderType: 'external',
          contract: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698'
        }
      }

      delete approval.data[field]

      const { queryByRole } = render(
        <TokenSpend approval={approval} requestedAmountHex={requestedAmountHex} updateApproval={() => {}} />
      )

      const custom = queryByRole('button', { name: 'Custom' })
      expect(custom).toBeNull()

      const requestedAmount = queryByRole('textbox')
      const displayedContent = requestedAmount.textContent.trim()
      expect(displayedContent).toBe(approval.data.decimals ? '100' : '100 million')

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

  formattedAmounts.forEach((spec) => {
    it(`formats a requested amount of ${spec.amount} as ${spec.formatted}`, () => {
      const amount = addHexPrefix((spec.amount * 1e6).toString(16))
      const requestedAmountHex = amount

      const approval = {
        id: 'erc20:approve',
        data: {
          spender: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
          amount: amount,
          decimals: 6,
          name: 'TST',
          symbol: 'TST',
          spenderEns: '',
          spenderType: 'external',
          contract: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698'
        }
      }

      const { queryByRole, getByText } = render(
        <TokenSpend approval={approval} requestedAmountHex={requestedAmountHex} updateApproval={() => {}} />
      )

      const requestedAmount = queryByRole('textbox')
      const displayedContent = requestedAmount.textContent.trim()
      expect(displayedContent).toBe(spec.formatted)
    })
  })
})
