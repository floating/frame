import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Restore from 'react-restore'
import store from '../../../../../../../../main/store'
import link from '../../../../../../../../resources/link'
import AdjustFeeComponent from '../../../../../../../../app/App/Main/Account/Requests/TransactionRequest/AdjustFee'

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

jest.mock('../../../../../../../../main/store/state', () => () => state)
jest.mock('../../../../../../../../main/store/persist')
jest.mock('../../../../../../../../resources/link')

const AddToken = Restore.connect(AdjustFeeComponent, store)

const setup = (jsx, options = {}) => ({ user: userEvent.setup(options), ...render(jsx) })

const advanceTimers = (ms = 0) => {
  jest.advanceTimersByTime(ms)
  return Promise.resolve()
}

let rerenderComponent

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

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

    // simulate nav updating notify data which will pass new props to this component
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
  it('should display the expected chain IDs', () => {
    const { getAllByRole } = setup(
      <AddToken activeChains={[
        { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
        { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }
      ]} />
    )

    const tokenChainNames = getAllByRole('button').map((el) => el.textContent)
    expect(tokenChainNames).toEqual(['Mainnet', 'Polygon'])
  })

  it('should prompt for a contract address after chain selection', async () => {
    const { user, getByRole, getByLabelText, rerender } = setup(
      <AddToken activeChains={[
        { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
        { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }
      ]} />, { advanceTimers: () => advanceTimers(200) }
    )

    rerenderComponent = rerender

    const polygonButton = getByRole('button', { name: 'Polygon' })
    await user.click(polygonButton)

    const contractAddressInput = getByLabelText(`Enter token's address`)
    expect(contractAddressInput.textContent).toBe('')
  })
})

describe('retrieving token metadata', () => {
  it('should display successfully loaded data', async () => {
    const { user, getByLabelText, getByRole, rerender } = setup(
      <AddToken activeChains={[
        { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
        { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }
      ]}
      data={{ notifyData: { chainId: 137 }}} />, { advanceTimers }
    )

    rerenderComponent = rerender
    
    const contractAddressLabel = getByLabelText(`Enter token's address`)
    await user.type(contractAddressLabel, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
    const setAddressButton = getByRole('button', { name: 'Set Address' })
    await user.click(setAddressButton)

    const contractAddressInput = getByRole('heading')
    const tokenNameInput = getByLabelText('Token Name')
    const tokenSymbolInput = getByLabelText('Symbol')
    const tokenDecimalsInput = getByLabelText('Decimals')

    expect(contractAddressInput.textContent).toEqual('0x3432b6a6d9c964d0')
    await waitFor(() => expect(tokenNameInput.value).toEqual('Frame Test on Polygon'), { timeout: 200 })
    expect(tokenSymbolInput.value).toEqual('mFRT')
    expect(tokenDecimalsInput.value).toEqual('18')
  })

  it('should show a form with defaults when data is not found', async () => {
    const { user, getByLabelText, getByRole, rerender } = setup(
      <AddToken activeChains={[
        { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
        { id: 137, name: 'Polygon', connection: { primary: { connected: true } } }
      ]}
      data={{ notifyData: { chainId: 137 }}} />, { advanceTimers }
    )

    rerenderComponent = rerender

    const contractAddressLabel = getByLabelText(`Enter token's address`)
    await user.type(contractAddressLabel, '0x3432b6a60d23ca0dfca7761b7ab56459dinvalid')      
    const setAddressButton = getByRole('button', { name: 'Set Address' })
    await user.click(setAddressButton)

    const contractAddressInput = getByRole('heading')
    const tokenNameInput = getByLabelText('Token Name')
    const tokenSymbolInput = getByLabelText('Symbol')
    const tokenDecimalsInput = getByLabelText('Decimals')

    expect(contractAddressInput.textContent).toEqual('0x3432b6a6dinvalid')
    expect(tokenNameInput.value).toEqual('Token Name')
    expect(tokenSymbolInput.value).toEqual('SYMBOL')
    expect(tokenDecimalsInput.value).toEqual('?')
  })
})
