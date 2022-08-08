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

const chainMetadata = {
  1: { name: 'Frame Test', symbol: 'FRT', decimals: '18' },
  137: { name: 'Frame Test on Polygon', symbol: 'mFRT', decimals: '18' }
}

jest.mock('../../../../../main/store/state', () => () => state)
jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link')

const AddToken = Restore.connect(AddTokenComponent, store)
const user = userEvent.setup()
let rerenderComponent

beforeEach(() => {
  link.invoke.mockImplementation((channel, contractAddress, chainId) => {
    if (contractAddress === '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0') {
      return Promise.resolve(chainMetadata[chainId])
    }

    return Promise.resolve({ name: '', symbol: '', decimals: 0 })
  })

  link.send.mockImplementation((channel, msg, { view, data: { notify, notifyData } }) => {
    expect(channel).toBe('tray:action')
    expect(msg).toBe('navDash')
    expect(view).toBe('tokens')
    expect(notify).toBe('addToken')
    rerenderComponent(
      <AddToken 
        activeChains={[
          { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
          { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }
        ]} 
        data={{ notifyData }} 
      />
    )
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
    const { getByText, getByLabelText, getByRole, rerender } = render(
      <AddToken activeChains={[
        { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
        { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }
      ]} />
    )
    rerenderComponent = rerender

    const selectPolygonButton = getByText('Polygon')
    await user.click(selectPolygonButton)
    
    await waitFor(async () => {
      const contractAddressInput = getByLabelText(`What is the token's contract address?`)
      await user.type(contractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')      
      const setAddressButton = getByRole('button')
      await user.click(setAddressButton)
    }, 200)

    const contractAddressInput = getByRole('heading')
    const tokenNameInput = getByLabelText('Token Name')
    const tokenSymbolInput = getByLabelText('Symbol')
    const tokenDecimalsInput = getByLabelText('Decimals')

    expect(contractAddressInput.textContent).toEqual('0x3432b6a6d9c964d0')
    expect(tokenNameInput.value).toEqual('Frame Test on Polygon')
    expect(tokenSymbolInput.value).toEqual('mFRT')
    expect(tokenDecimalsInput.value).toEqual('18')
  }, 800)

  it('should show a form with defaults when data is not found', async () => {
    const { getByText, getByLabelText, getByRole, rerender } = render(
      <AddToken activeChains={[
        { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
        { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }
      ]} />
    )
    rerenderComponent = rerender

    const selectPolygonButton = getByText('Polygon')
    await user.click(selectPolygonButton)

    await waitFor(async () => {
      const contractAddressInput = getByLabelText(`What is the token's contract address?`)
      await user.type(contractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459dinvalid')      
      const setAddressButton = getByRole('button')
      await user.click(setAddressButton)
    }, 200)

    const contractAddressInput = getByRole('heading')
    const tokenNameInput = getByLabelText('Token Name')
    const tokenSymbolInput = getByLabelText('Symbol')
    const tokenDecimalsInput = getByLabelText('Decimals')

    expect(contractAddressInput.textContent).toEqual('0x3432b6a6dinvalid')
    expect(tokenNameInput.value).toEqual('')
    expect(tokenSymbolInput.value).toEqual('')
    expect(tokenDecimalsInput.value).toEqual('0')
  }, 800)
})
