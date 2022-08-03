import React from 'react'
import { render } from '@testing-library/react'
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

const chainMetadata = {
  1: { name: 'Frame Test', symbol: 'FRT', decimals: '18' },
  137: { name: 'Frame Test on Polygon', symbol: 'mFRT', decimals: '18' }
}

jest.mock('../../../../../main/store/state', () => () => state)
jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link')

const AddToken = Restore.connect(AddTokenComponent, store)
const user = userEvent.setup()

beforeEach(() => {
  link.invoke.mockImplementation((channel, contractAddress, chainId) => {
    if (contractAddress === '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0') {
      return Promise.resolve(chainMetadata[chainId])
    }

    return Promise.resolve({})
  })
})

describe('selecting token chain', () => {
  it('should display the expected chain IDs', async () => {
    const { getAllByRole } = render(
      <AddToken activeChains={[
        { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
        { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }
      ]} />
    )

    const tokenChainNames = getAllByRole('button').map((el) => el.textContent)
    expect(tokenChainNames).toEqual(['Mainnet', 'Polygon'])
  })
})

describe('retrieving token metadata', () => {
  it('should display successfully loaded data', async () => {
    const { findByLabelText, getByText, getByLabelText, getByRole } = render(
      <AddToken activeChains={[
        { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
        { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }
      ]} />
    )

    await user.click(getByText('Polygon'))

    const contractAddressInput = await findByLabelText(`What is the token's contract address?`)
    await user.type(contractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
    const setAddressButton = getByRole('button')
    await user.click(setAddressButton)

    const tokenNameInput = getByLabelText('Token Name')
    const tokenSymbolInput = getByLabelText('Symbol')
    const tokenDecimalsInput = getByLabelText('Decimals')

    expect(contractAddressInput.value).toEqual('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
    expect(tokenNameInput.value).toEqual('Frame Test on Polygon')
    expect(tokenSymbolInput.value).toEqual('mFRT')
    expect(tokenDecimalsInput.value).toEqual('18')
  }, 800)

  it('should show a form with defaults when data is not found', async () => {
    const { findByLabelText, getByText, getByLabelText, getByRole } = render(
      <AddToken activeChains={[
        { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
        { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }
      ]} />
    )

    await user.click(getByText('Polygon'))

    const contractAddressInput = await findByLabelText(`What is the token's contract address?`)
    await user.type(contractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459dinvalid')
    const setAddressButton = getByRole('button')
    await user.click(setAddressButton)

    const tokenNameInput = getByLabelText('Token Name')
    const tokenSymbolInput = getByLabelText('Symbol')
    const tokenDecimalsInput = getByLabelText('Decimals')

    expect(contractAddressInput.value).toEqual('0x3432b6a60d23ca0dfca7761b7ab56459dinvalid')
    expect(tokenNameInput.value).toEqual('Token Name')
    expect(tokenSymbolInput.value).toEqual('SYMBOL')
    expect(tokenDecimalsInput.value).toEqual('?')
  }, 800)
})
