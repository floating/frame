import React from 'react'
import { render, screen } from '../../../componentSetup'
import EditTokenSpend from '../../../../resources/Components/EditTokenSpend'
import BigNumber from 'bignumber.js'
import { max } from '../../../../resources/utils/numbers'

const maxIntStr = max.toString(10)

describe('changing approval amounts', () => {
  it('allows the user to set the token approval to a custom amount', async () => {
    const onUpdate = jest.fn()
    const requestedAmount = BigNumber('0x011170')
    const approval = {
      id: 'erc20:approve',
      data: {
        spender: {
          address: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
          ens: '',
          type: 'external'
        },
        amount: '0x' + requestedAmount.toString(16),
        decimals: 4,
        name: 'TST',
        symbol: 'TST',
        contract: {
          address: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698',
          ens: '',
          type: 'contract'
        }
      }
    }

    const { user } = render(
      <EditTokenSpend data={approval.data} requestedAmount={requestedAmount} updateRequest={onUpdate} />
    )

    const custom = screen.queryByRole('button', { name: 'Custom' })
    await user.click(custom)

    const enterAmount = screen.queryByRole('textbox', { label: 'Custom Amount' })
    await user.type(enterAmount, '50')

    const updateCustom = screen.getByText('update')
    await user.click(updateCustom)

    expect(onUpdate).toHaveBeenCalledWith('500000')
  })

  it('allows users to input custom amounts which are decimal', async () => {
    const onUpdate = jest.fn()
    const requestedAmount = BigNumber('0x011170')
    const approval = {
      id: 'erc20:approve',
      data: {
        spender: {
          address: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
          ens: '',
          type: 'external'
        },
        amount: '0x' + requestedAmount.toString(16),
        decimals: 4,
        name: 'TST',
        symbol: 'TST',
        contract: {
          address: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698',
          ens: '',
          type: 'contract'
        }
      }
    }

    const { user } = render(
      <EditTokenSpend data={approval.data} requestedAmount={requestedAmount} updateRequest={onUpdate} />
    )

    const custom = screen.queryByRole('button', { name: 'Custom' })
    await user.click(custom)

    const enterAmount = screen.queryByRole('textbox', { label: 'Custom Amount' })
    await user.type(enterAmount, '50.1')

    const updateCustom = screen.getByText('update')
    await user.click(updateCustom)

    expect(onUpdate).toHaveBeenCalledWith('501000')
  })

  it('does not allow users to input a custom amount with more decimals than allowed by the contract', async () => {
    const onUpdate = jest.fn()
    const requestedAmount = BigNumber('0x011170')
    const approval = {
      id: 'erc20:approve',
      data: {
        spender: {
          address: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
          ens: '',
          type: 'external'
        },
        amount: '0x' + requestedAmount.toString(16),
        decimals: 4,
        name: 'TST',
        symbol: 'TST',
        contract: {
          address: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698',
          ens: '',
          type: 'contract'
        }
      }
    }

    const { user } = render(
      <EditTokenSpend data={approval.data} requestedAmount={requestedAmount} updateRequest={onUpdate} />
    )

    const custom = screen.queryByRole('button', { name: 'Custom' })
    await user.click(custom)

    const enterAmount = screen.queryByRole('textbox', { label: 'Custom Amount' })
    await user.type(enterAmount, '50.00001')

    const updateCustom = screen.getByText('update')
    await user.click(updateCustom)

    expect(onUpdate).toHaveBeenCalledWith('500000')
  })

  it('does not allows the user to set the token approval to a custom amount for an unknown token', () => {
    const requestedAmount = BigNumber('0x100e6')
    const approval = {
      id: 'erc20:approve',
      data: {
        spender: {
          address: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
          ens: '',
          type: 'external'
        },
        amount: '0x' + requestedAmount.toString(16),
        decimals: 6,
        symbol: 'aUSDC',
        contract: {
          address: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698',
          type: 'contract',
          ens: ''
        }
      }
    }

    render(<EditTokenSpend data={approval.data} requestedAmount={requestedAmount} updateRequest={() => {}} />)

    const custom = screen.queryByRole('button', { name: 'Custom' })
    expect(custom).toBe(null)
  })

  it('allows the user to set the token approval to unlimited', async () => {
    const onUpdate = jest.fn()
    const requestedAmount = BigNumber('0x011170')

    const approval = {
      id: 'erc20:approve',
      data: {
        spender: { address: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4', ens: '', type: 'external' },
        amount: '0x' + requestedAmount.toString(16),
        decimals: 4,
        name: 'TST',
        symbol: 'TST',
        contract: { address: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698', ens: '', type: 'contract' }
      }
    }

    const { user } = render(
      <EditTokenSpend data={approval.data} requestedAmount={requestedAmount} updateRequest={onUpdate} />
    )

    const custom = screen.queryByRole('button', { name: 'Custom' })
    await user.click(custom)

    const setUnlimited = screen.queryByRole('button', { name: 'Unlimited' })
    await user.click(setUnlimited)

    expect(onUpdate).toHaveBeenCalledWith(maxIntStr)
  })

  it('allows the user to revert the token approval back to the original request', async () => {
    const onUpdate = jest.fn()
    const requestedAmountHex = '0x011170'
    const requestedAmount = BigNumber(requestedAmountHex)
    const approval = {
      id: 'erc20:approve',
      data: {
        spender: { address: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4', ens: '', type: 'external' },
        amount: requestedAmountHex,
        decimals: 4,
        name: 'TST',
        symbol: 'TST',
        contract: {
          address: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698',
          ens: '',
          type: 'contract'
        }
      }
    }

    const { user } = render(
      <EditTokenSpend data={approval.data} requestedAmount={requestedAmount} updateRequest={onUpdate} />
    )

    const setUnlimited = screen.queryByRole('button', { name: 'Unlimited' })
    await user.click(setUnlimited)

    const setRequested = screen.queryByRole('button', { name: 'Requested' })
    await user.click(setRequested)

    expect(onUpdate).toHaveBeenNthCalledWith(1, maxIntStr)
    expect(onUpdate).toHaveBeenNthCalledWith(2, '70000')
  })

  it('allows the user to revert the token approval back to the original amount when no decimal data is present', async () => {
    const onUpdate = jest.fn()
    const requestedAmountHex = '0x011170'
    const requestedAmount = BigNumber(requestedAmountHex)
    const approval = {
      id: 'erc20:approve',
      data: {
        spender: {
          address: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
          ens: '',
          type: 'external'
        },
        amount: requestedAmountHex,
        name: 'TST',
        symbol: 'TST',
        contract: {
          address: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698',
          ens: '',
          type: 'contract'
        }
      }
    }

    const { user } = render(
      <EditTokenSpend data={approval.data} requestedAmount={requestedAmount} updateRequest={onUpdate} />
    )

    const setUnlimited = screen.queryByRole('button', { name: 'Unlimited' })
    await user.click(setUnlimited)

    const setRequested = screen.queryByRole('button', { name: 'Requested' })
    await user.click(setRequested)

    expect(onUpdate).toHaveBeenNthCalledWith(1, maxIntStr)
    expect(onUpdate).toHaveBeenNthCalledWith(2, BigNumber('0x011170').toString(10))
  })

  const requiredApprovalData = ['decimals', 'symbol', 'name']

  requiredApprovalData.forEach((field) => {
    it(`does not allow the user to edit the amount if ${field} is not present in approval data`, async () => {
      const requestedAmountHex = '0x' + (100e6).toString(16)
      const approval = {
        id: 'erc20:approve',
        data: {
          spender: {
            address: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
            ens: '',
            type: 'external'
          },
          amount: requestedAmountHex,
          decimals: 6,
          name: 'TST',
          symbol: 'TST',
          contract: {
            address: '0x1eba19f260421142AD9Bf5ba193f6d4A0825e698',
            ens: '',
            type: 'contract'
          }
        }
      }

      delete approval.data[field]

      const { user } = render(
        <EditTokenSpend
          data={approval.data}
          requestedAmount={BigNumber(requestedAmountHex)}
          updateRequest={() => {}}
        />
      )

      const custom = screen.queryByRole('button', { name: 'Custom' })
      expect(custom).toBeNull()

      const requestedAmount = screen.queryByRole('textbox')
      const displayedContent = requestedAmount.textContent.trim()
      expect(displayedContent).toBe(approval.data.decimals ? '100' : '100000000')

      // ensure click on requested amount textbox doesn't allow user to enter a custom amount
      await user.click(requestedAmount)
      expect(screen.queryByRole('textbox', { name: 'Custom Amount' })).toBeNull()
    })
  })
})
