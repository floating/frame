import React from 'react'
import { addHexPrefix } from '@ethereumjs/util'
import Restore from 'react-restore'

import { render, screen } from '../../../../../../../componentSetup'
import store from '../../../../../../../../main/store'
import ApproveTokenSpendComponent from '../../../../../../../../app/tray/Account/Account/Requests/TransactionRequest/TokenSpend'

jest.mock('../../../../../../../../main/store/persist')

const TokenSpend = Restore.connect(ApproveTokenSpendComponent, store)

describe('changing approval amounts', () => {
  it('allows the user to set the token approval to a custom amount', async () => {
    return new Promise((resolve, reject) => {
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

      const { user } = render(
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
      ;(async () => {
        const custom = screen.queryByRole('button', { name: 'Custom' })
        await user.click(custom)

        const enterAmount = screen.queryByRole('textbox', { label: 'Custom Amount' })
        await user.type(enterAmount, '50')

        const updateCustom = screen.getByText('update')
        await user.click(updateCustom)
      })()
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

    render(
      <TokenSpend approval={approval} requestedAmountHex={requestedAmountHex} updateApproval={() => {}} />
    )

    const custom = screen.queryByRole('button', { name: 'Custom' })
    expect(custom).toBe(null)
  })

  it('allows the user to set the token approval to unlimited', async () => {
    return new Promise((resolve, reject) => {
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

      const { user } = render(
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
      ;(async () => {
        const custom = screen.queryByRole('button', { name: 'Custom' })
        await user.click(custom)

        const setUnlimited = screen.queryByRole('button', { name: 'Unlimited' })
        await user.click(setUnlimited)
      })()
    })
  })

  it('allows the user to revert the token approval back to the original request', async () => {
    return new Promise((resolve, reject) => {
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
      let firstCall = true

      const { user } = render(
        <TokenSpend
          approval={approval}
          requestedAmountHex={requestedAmountHex}
          updateApproval={(amount) => {
            try {
              expect(amount).toBe(
                firstCall ? '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' : '0x011170'
              )
              if (!firstCall) {
                resolve()
              }
              firstCall = false
            } catch (e) {
              reject(e)
            }
          }}
        />
      )
      ;(async () => {
        const setUnlimited = screen.queryByRole('button', { name: 'Unlimited' })
        await user.click(setUnlimited)

        const setRequested = screen.queryByRole('button', { name: 'Requested' })
        await user.click(setRequested)
      })()
    })
  })

  it('allows the user to revert the token approval back to the original amount when no decimal data is present', async () => {
    return new Promise((resolve, reject) => {
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
      let firstCall = true

      const { user } = render(
        <TokenSpend
          approval={approval}
          requestedAmountHex={requestedAmountHex}
          updateApproval={(amount) => {
            try {
              expect(amount).toBe(
                firstCall ? '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' : '0x011170'
              )
              if (!firstCall) {
                resolve()
              }
              firstCall = false
            } catch (e) {
              reject(e)
            }
          }}
        />
      )
      ;(async () => {
        const setUnlimited = screen.queryByRole('button', { name: 'Unlimited' })
        await user.click(setUnlimited)

        const setRequested = screen.queryByRole('button', { name: 'Requested' })
        await user.click(setRequested)
      })()
    })
  })

  const requiredApprovalData = ['decimals', 'symbol', 'name']

  requiredApprovalData.forEach((field) => {
    it(`does not allow the user to edit the amount if ${field} is not present in approval data`, async () => {
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

      const { user } = render(
        <TokenSpend approval={approval} requestedAmountHex={requestedAmountHex} updateApproval={() => {}} />
      )

      const custom = screen.queryByRole('button', { name: 'Custom' })
      expect(custom).toBeNull()

      const requestedAmount = screen.queryByRole('textbox')
      const displayedContent = requestedAmount.textContent.trim()
      expect(displayedContent).toBe(approval.data.decimals ? '100' : '100 million')

      // ensure click on requested amount textbox doesn't allow user to enter a custom amount
      await user.click(requestedAmount)
      expect(screen.queryByRole('textbox', { name: 'Custom Amount' })).toBeNull()
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

      render(
        <TokenSpend approval={approval} requestedAmountHex={requestedAmountHex} updateApproval={() => {}} />
      )

      const requestedAmount = screen.queryByRole('textbox')
      const displayedContent = requestedAmount.textContent.trim()
      expect(displayedContent).toBe(spec.formatted)
    })
  })
})
