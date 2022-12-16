import React from 'react'
import Restore from 'react-restore'
import { render, waitFor } from '@testing-library/react'

import { setupComponent, advanceTimers } from '../../../../componentSetup'
import store from '../../../../../main/store'
import link from '../../../../../resources/link'
import AddTokenComponent from '../../../../../dash/App/Tokens/AddToken'

jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link', () => ({
  invoke: jest.fn().mockResolvedValue({}),
  send: jest.fn()
}))

const AddToken = Restore.connect(AddTokenComponent, store)

beforeAll(() => {
  store.addNetwork({
    id: 1,
    type: 'ethereum',
    name: 'Mainnet',
    explorer: 'https://etherscan.io',
    symbol: 'ETH',
    on: true,
    connection: {
      primary: { connected: true }
    }
  })

  store.setPrimary('ethereum', 1, { connected: false })
  store.activateNetwork('ethereum', 1, true)

  store.addNetwork({
    id: 137,
    type: 'ethereum',
    name: 'Polygon',
    explorer: 'https://polygonscan.com',
    symbol: 'MATIC',
    on: true,
    connection: {
      primary: { connected: true }
    }
  })

  store.setPrimary('ethereum', 137, { connected: false })
  store.activateNetwork('ethereum', 137, true)
})

describe('selecting token chain', () => {
  it('should display the expected chain IDs', () => {
    const { getAllByRole } = render(<AddToken />)

    const tokenChainNames = getAllByRole('button').map((el) => el.textContent)
    expect(tokenChainNames).toEqual(['Mainnet', 'Polygon'])
  })

  it('should update add token navigation when a chain is selected', async () => {
    // 200 ms UI delay after clicking the button to select a chain
    const { user, getByRole } = setupComponent(<AddToken />, { advanceTimers: () => advanceTimers(200) })

    const polygonButton = getByRole('button', { name: 'Polygon' })
    await user.click(polygonButton)

    expect(link.send).toHaveBeenCalledWith('tray:action', 'navDash', {
      view: 'tokens',
      data: {
        notify: 'addToken',
        notifyData: {
          chainId: 137
        }
      }
    })
  })
})

describe('setting token address', () => {
  it('should prompt for a contract address if a chain has been selected', () => {
    const { getByLabelText } = render(<AddToken data={{ notifyData: { chainId: 137 } }} />)

    const contractAddressInput = getByLabelText(`Enter token's address`)
    expect(contractAddressInput.textContent).toBe('')
  })

  it('should update add token navigation with an error when a user submits an invalid contract address', async () => {
    const { user, getByLabelText, getByRole } = setupComponent(
      <AddToken data={{ notifyData: { chainId: 1 } }} />
    )
    const contractAddressInput = getByLabelText(`Enter token's address`)
    await user.type(contractAddressInput, 'INVALID_ADDRESS')
    const setAddressButton = getByRole('button', { name: 'Set Address' })
    await user.click(setAddressButton)

    expect(link.send).toHaveBeenCalledTimes(1)
    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'tokens',
      data: {
        notify: 'addToken',
        notifyData: {
          chainId: 1,
          address: 'INVALID_ADDRESS',
          error: 'INVALID CONTRACT ADDRESS'
        }
      }
    })
  })

  it('should update add token navigation when a contracts details cannot be validated on-chain', async () => {
    store.setPrimary('ethereum', 1, { connected: true })
    link.invoke.mockImplementationOnce((action, address, chainId) => {
      expect(action).toBe('tray:getTokenDetails')
      expect(address).toBe('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
      expect(chainId).toBe(1)
      return {
        decimals: 0,
        name: '',
        symbol: '',
        totalSupply: ''
      }
    })

    const { user, getByLabelText, getByRole } = setupComponent(
      <AddToken data={{ notifyData: { chainId: 1 } }} />
    )
    const contractAddressLabel = getByLabelText(`Enter token's address`)
    await user.type(contractAddressLabel, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
    const setAddressButton = getByRole('button', { name: 'Set Address' })
    await user.click(setAddressButton)

    expect(link.send).toHaveBeenCalledTimes(1)
    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'tokens',
      data: {
        notify: 'addToken',
        notifyData: {
          chainId: 1,
          address: '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0',
          error: `COULD NOT FIND TOKEN WITH ADDRESS 0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0`,
          tokenData: {
            decimals: 0,
            name: '',
            symbol: '',
            totalSupply: ''
          }
        }
      }
    })
  })

  it('should update add token navigation with the contract details when a valid address is entered for a connected chain', async () => {
    const mockTokenData = {
      decimals: 420,
      name: 'FAKE COIN',
      symbol: 'FAKE',
      totalSupply: '100000'
    }

    link.invoke.mockImplementationOnce((action, address, chainId) => {
      expect(action).toBe('tray:getTokenDetails')
      expect(address).toBe('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
      expect(chainId).toBe(1)
      return mockTokenData
    })

    const { user, getByLabelText, getByRole } = setupComponent(
      <AddToken data={{ notifyData: { chainId: 1 } }} />
    )

    const contractAddressLabel = getByLabelText(`Enter token's address`)
    await user.type(contractAddressLabel, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
    const setAddressButton = getByRole('button', { name: 'Set Address' })
    await user.click(setAddressButton)

    expect(link.send).toHaveBeenCalledTimes(1)
    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'tokens',
      data: {
        notify: 'addToken',
        notifyData: {
          error: null,
          chainId: 1,
          address: '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0',
          tokenData: mockTokenData
        }
      }
    })
  })
})

describe('displaying errors', () => {
  it('should allow the user to navigate back when displaying an error', () => {
    const { getAllByRole } = render(
      <AddToken
        data={{ notifyData: { chainId: 137, error: 'INVALID CONTRACT ADDRESS', address: '0xabc' } }}
      />
    )

    const buttons = getAllByRole('button')
    expect(buttons.length).toBe(1)
    expect(buttons[0].textContent).toBe('BACK')
  })

  it(`should allow the user to proceed if we are unable to verify the token data`, () => {
    const { getAllByRole } = render(
      <AddToken
        data={{
          notifyData: { chainId: 137, error: `COULD NOT FIND TOKEN WITH ADDRESS BLAH BLAH`, address: '0xabc' }
        }}
      />
    )

    const buttons = getAllByRole('button')
    expect(buttons.length).toBe(2)
    expect(buttons[0].textContent).toBe('BACK')
    expect(buttons[1].textContent).toBe('ADD ANYWAY')
  })
})

describe('setting token details', () => {
  it('should display the correct copy when editing a token', () => {
    const { getByTestId, getByRole } = render(
      <AddToken
        data={{
          notifyData: {
            chainId: 1,
            address: '0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D4',
            isEdit: true,
            tokenData: {
              decimals: 12,
              symbol: 'FAKE',
              name: 'FAKE',
              address: '0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D4',
              totalSupply: '100'
            }
          }
        }}
      />
    )
    const heading = getByTestId('addTokenFormTitle')
    const button = getByRole('button')
    expect(heading.textContent).toBe('Edit Token')
    expect(button.textContent).toBe('Save')
  })

  it('should display the correct copy when adding a new token', () => {
    const { getByTestId, getByRole } = render(
      <AddToken
        data={{
          notifyData: { chainId: 1, address: '0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D4' }
        }}
      />
    )
    const heading = getByTestId('addTokenFormTitle')
    const button = getByRole('button')
    expect(heading.textContent).toBe('Add New Token')
    expect(button.textContent).toBe('Fill in Token Details')
  })

  it('should prompt for default token details', () => {
    const { getByLabelText, getByRole } = render(
      <AddToken
        data={{ notifyData: { chainId: 137, address: '0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D4' } }}
      />
    )

    const contractAddressInput = getByRole('heading')
    const tokenNameInput = getByLabelText('Token Name')
    const tokenSymbolInput = getByLabelText('Symbol')
    const tokenDecimalsInput = getByLabelText('Decimals')

    expect(contractAddressInput.textContent).toEqual('0x64aa3364D7e7f1D4')
    expect(tokenNameInput.value).toEqual('Token Name')
    expect(tokenSymbolInput.value).toEqual('SYMBOL')
    expect(tokenDecimalsInput.value).toEqual('?')
  })

  it('should populate fields with token data where available', async () => {
    store.setPrimary('ethereum', 137, { connected: true })

    const mockToken = { name: 'Frame Test on Polygon', symbol: 'mFRT', decimals: 18, totalSupply: '1066' }

    const { getByLabelText, getByRole } = render(
      <AddToken
        data={{
          notifyData: {
            chainId: 1,
            address: '0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D4',
            tokenData: mockToken
          }
        }}
      />
    )

    const contractAddressInput = getByRole('heading')
    const tokenNameInput = getByLabelText('Token Name')
    const tokenSymbolInput = getByLabelText('Symbol')
    const tokenDecimalsInput = getByLabelText('Decimals')

    expect(contractAddressInput.textContent).toEqual('0x64aa3364D7e7f1D4')
    await waitFor(() => expect(tokenNameInput.value).toEqual('Frame Test on Polygon'), { timeout: 200 })
    expect(tokenSymbolInput.value).toEqual('mFRT')
    expect(tokenDecimalsInput.value).toEqual('18')
  })
})
