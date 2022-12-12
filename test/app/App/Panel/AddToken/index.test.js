import React from 'react'
import Restore from 'react-restore'
import { render } from '@testing-library/react'

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

  it('should show the correct error screen when an invalid address is entered', async () => {
    const { user, getByLabelText, getByRole, getByDisplayValue } = setupComponent(
      <AddToken data={{ notifyData: { chainId: 137 } }} />
    )
    const contractAddressInput = getByLabelText(`Enter token's address`)
    await user.type(contractAddressInput, 'INVALID_ADDRESS')
    const setAddressButton = getByRole('button', { name: 'Set Address' })
    await user.click(setAddressButton)

    expect(getByDisplayValue('INVALID CONTRACT ADDRESS').toBeTruthy())
    // const backButton = getByDisplayValue('BACK')
    // const addAnywayButton = getByDisplayValue('ADD ANYWAY')
    // expect(backButton.textContent).toBeTruthy()
    // expect(addAnywayButton).toBeFalsy()
  })

  it('should show the correct error screen when a contracts details cannot be validated on-chain', async () => {
    link.invoke.mockImplementationOnce((action, address, chainId) => {
      expect(action).toBe('tray:getTokenDetails')
      expect(address).toBe('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
      expect(chainId).toBe(137)
      return {
        decimals: 0,
        name: '',
        symbol: '',
        totalSupply: ''
      }
    })

    const { user, getByLabelText, getByRole, getByDisplayValue } = setupComponent(
      <AddToken data={{ notifyData: { chainId: 137 } }} />
    )
    const contractAddressLabel = getByLabelText(`Enter token's address`)
    await user.type(contractAddressLabel, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
    const setAddressButton = getByRole('button', { name: 'Set Address' })
    await user.click(setAddressButton)
    const backButton = getByDisplayValue('BACK')
    const addAnywayButton = getByDisplayValue('ADD ANYWAY')

    expect(backButton.textContent).toBeTruthy()
    expect(addAnywayButton).toBeTruthy()
    expect(link.invoke).toHaveBeenCalledTimes(1)
  })

  it('should update add token navigation when an address is entered', async () => {
    const { user, getByLabelText, getByRole } = setupComponent(
      <AddToken data={{ notifyData: { chainId: 137 } }} />
    )

    const contractAddressLabel = getByLabelText(`Enter token's address`)
    await user.type(contractAddressLabel, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
    const setAddressButton = getByRole('button', { name: 'Set Address' })
    await user.click(setAddressButton)

    expect(link.send).toHaveBeenCalledWith('tray:action', 'navDash', {
      view: 'tokens',
      data: {
        notify: 'addToken',
        notifyData: {
          chainId: 137,
          address: '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0'
        }
      }
    })
  })

  it('should retrieve token metadata from a connected chain when an address is entered', async () => {
    store.setPrimary('ethereum', 137, { connected: true })

    const { user, getByLabelText, getByRole } = setupComponent(
      <AddToken data={{ notifyData: { chainId: 137 } }} />
    )

    const contractAddressLabel = getByLabelText(`Enter token's address`)
    await user.type(contractAddressLabel, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
    const setAddressButton = getByRole('button', { name: 'Set Address' })
    await user.click(setAddressButton)

    expect(link.invoke).toHaveBeenCalledWith(
      'tray:getTokenDetails',
      '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0',
      137
    )
  })
})

// describe('setting token details', () => {
//   it('should prompt for default token details', () => {
//     const { getByLabelText, getByRole } = render(
//       <AddToken
//         data={{ notifyData: { chainId: 137, address: '0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D4' } }}
//       />
//     )

//     const contractAddressInput = getByRole('heading')
//     const tokenNameInput = getByLabelText('Token Name')
//     const tokenSymbolInput = getByLabelText('Symbol')
//     const tokenDecimalsInput = getByLabelText('Decimals')

//     expect(contractAddressInput.textContent).toEqual('0x64aa3364D7e7f1D4')
//     expect(tokenNameInput.value).toEqual('Token Name')
//     expect(tokenSymbolInput.value).toEqual('SYMBOL')
//     expect(tokenDecimalsInput.value).toEqual('?')
//   })

//   it('should update with loaded token metadata', async () => {
//     store.setPrimary('ethereum', 137, { connected: true })

//     const { user, getByLabelText, getByRole, rerender } = setupComponent(
//       <AddToken data={{ notifyData: { chainId: 137 } }} />
//     )

//     link.invoke.mockResolvedValue({
//       name: 'Frame Test on Polygon',
//       symbol: 'mFRT',
//       decimals: 18
//     })

//     link.send.mockImplementation(() => {
//       rerender(
//         <AddToken
//           data={{ notifyData: { chainId: 137, address: '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0' } }}
//         />
//       )
//     })

//     const contractAddressLabel = getByLabelText(`Enter token's address`)
//     await user.type(contractAddressLabel, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
//     const setAddressButton = getByRole('button', { name: 'Set Address' })
//     await user.click(setAddressButton)

//     const contractAddressInput = getByRole('heading')
//     const tokenNameInput = getByLabelText('Token Name')
//     const tokenSymbolInput = getByLabelText('Symbol')
//     const tokenDecimalsInput = getByLabelText('Decimals')

//     expect(contractAddressInput.textContent).toEqual('0x3432b6a6d9c964d0')
//     await waitFor(() => expect(tokenNameInput.value).toEqual('Frame Test on Polygon'), { timeout: 200 })
//     expect(tokenSymbolInput.value).toEqual('mFRT')
//     expect(tokenDecimalsInput.value).toEqual('18')
//   })
// })
