import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Restore from 'react-restore'
import store from '../../../../../main/store'
import link from '../../../../../resources/link'
import AddTokenComponent from '../../../../../dash/App/Tokens/AddToken'

const state = {
  main: {
    networks: { 
      ethereum: {
        1: {
          name: 'Mainnet',
          on: true
        },
        137: {
          name: 'Polygon',
          on: true
        }
      }
    }
  }
}

jest.mock('../../../../../main/store/state', () => () => state)
jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link')

const AddToken = Restore.connect(AddTokenComponent, store)
const user = userEvent.setup()

beforeEach(() => {
  link.invoke.mockImplementation((channel, contractAddress, chainId) => {
    if (contractAddress === '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0') {
      const tokenData = chainId === 1 ? { name: 'Frame Test', symbol: 'FRT', decimals: '18' } : { name: 'Frame Test on Polygon', symbol: 'mFRT', decimals: '18' }
      return Promise.resolve(tokenData)
    }

    return Promise.resolve({})
  })
})

describe('selecting token chain', () => {
  it('should display the expected chain IDs', async () => {
    const { getAllByRole } = render(
      <AddToken activeChains={[{ id: 1, name: 'Mainnet', connection: { primary: { connected: true } } }, { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }]} />
    )

    const tokenChainNames = getAllByRole('button').map((el) => el.textContent)
    expect(tokenChainNames).toEqual(['Mainnet', 'Polygon'])
  })

  it('should generate the expected HTML', async () => {
    const { asFragment } = render(
      <AddToken activeChains={[{ id: 1, name: 'Mainnet', connection: { primary: { connected: true } } }, { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }]} />
    )

    expect(asFragment()).toMatchSnapshot()
  })
})

describe('entering token contract address', () => {
  it('should prompt for the token contract address', async () => {
    const { getAllByRole, findByLabelText, findByText } = render(
      <AddToken activeChains={[{ id: 1, name: 'Mainnet', connection: { primary: { connected: true } } }, { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }]} />
    )
    const tokenChains = getAllByRole('button')
    await user.click(tokenChains[1])
    
    await findByLabelText(`What is the token's contract address?`, { selector: 'input' })
    await findByText('on Polygon')
  }, 1000)

  it('should generate the expected HTML', async () => {
    const { asFragment, getAllByRole } = render(
      <AddToken activeChains={[{ id: 1, name: 'Mainnet', connection: { primary: { connected: true } } }, { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }]} />
    )
    const tokenChains = getAllByRole('button')
    await user.click(tokenChains[1])

    await waitFor(() => expect(asFragment()).toMatchSnapshot())
  }, 1000)
})

describe('retrieving token metadata - successful lookup', () => {
  it('should perform a lookup on a contract address and display the expected token metadata', async () => {
    const { findByLabelText, getAllByRole, findByRole } = render(
      <AddToken activeChains={[{ id: 1, name: 'Mainnet', connection: { primary: { connected: true } } }, { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }]} />
    )

    const tokenChains = getAllByRole('button')
    await user.click(tokenChains[1])

    const contractAddressInput = await findByLabelText(`What is the token's contract address?`)
    await user.type(contractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
    const setAddressButton = await findByRole('button')
    await user.click(setAddressButton)

    const tokenNameInput = await findByLabelText('Token Name')
    const tokenSymbolInput = await findByLabelText('Symbol')
    const tokenDecimalsInput = await findByLabelText('Decimals')

    expect(contractAddressInput.value).toEqual('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
    expect(tokenNameInput.value).toEqual('Frame Test on Polygon')
    expect(tokenSymbolInput.value).toEqual('mFRT')
    expect(tokenDecimalsInput.value).toEqual('18')
  }, 1000)

  it('should generate the expected HTML', async () => {
    const { asFragment, findByLabelText, getAllByRole, findByRole } = render(
      <AddToken activeChains={[{ id: 1, name: 'Mainnet', connection: { primary: { connected: true } } }, { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }]} />
    )
    const tokenChains = getAllByRole('button')
    await user.click(tokenChains[1])

    const contractAddressInput = await findByLabelText(`What is the token's contract address?`)
    await user.type(contractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
    const setAddressButton = await findByRole('button')
    await user.click(setAddressButton)

    await waitFor(() => expect(asFragment()).toMatchSnapshot())
  }, 1000)
})

describe('retrieving token metadata - unsuccessful lookup', () => {
  it('should perform a lookup on a contract address and not display any metadata', async () => {
    const { findByLabelText, getAllByRole, findByRole } = render(
      <AddToken activeChains={[{ id: 1, name: 'Mainnet', connection: { primary: { connected: true } } }, { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }]} />
    )

    const tokenChains = getAllByRole('button')
    await user.click(tokenChains[1])

    const contractAddressInput = await findByLabelText(`What is the token's contract address?`)
    await user.type(contractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459dinvalid')
    const setAddressButton = await findByRole('button')
    await user.click(setAddressButton)

    const tokenNameInput = await findByLabelText('Token Name')
    const tokenSymbolInput = await findByLabelText('Symbol')
    const tokenDecimalsInput = await findByLabelText('Decimals')

    expect(contractAddressInput.value).toEqual('0x3432b6a60d23ca0dfca7761b7ab56459dinvalid')
    expect(tokenNameInput.value).toEqual('Token Name')
    expect(tokenSymbolInput.value).toEqual('SYMBOL')
    expect(tokenDecimalsInput.value).toEqual('?')
  }, 1000)

  it('should generate the expected HTML', async () => {
    const { asFragment, findByLabelText, getAllByRole, findByRole } = render(
      <AddToken activeChains={[{ id: 1, name: 'Mainnet', connection: { primary: { connected: true } } }, { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }]} />
    )
    const tokenChains = getAllByRole('button')
    await user.click(tokenChains[1])

    const contractAddressInput = await findByLabelText(`What is the token's contract address?`)
    await user.type(contractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459dinvalid')
    const setAddressButton = await findByRole('button')
    await user.click(setAddressButton)

    await waitFor(() => expect(asFragment()).toMatchSnapshot())
  }, 1000)
})
