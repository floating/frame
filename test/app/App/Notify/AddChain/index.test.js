import React from 'react'
import Restore from 'react-restore'

import store from '../../../../../main/store'
import link from '../../../../../resources/link'
import { setupComponent } from '../../../../componentSetup'
import AddChainComponent from '../../../../../dash/App/Notify/AddChain'

jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link', () => ({ send: jest.fn() }))

const AddChain = Restore.connect(AddChainComponent, store)

beforeAll(() => {
  jest.useFakeTimers()

  store.removeNetwork({ type: 'ethereum', id: 137 })
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
})

afterAll(() => {
  jest.useRealTimers()
})

it('renders the title', () => {
  const { getByRole } = renderForm()

  const titleSection = getByRole('title')
  expect(titleSection.textContent).toBe('Add New Chain')
})

it('renders the submit button text', () => {
  const { getByRole } = renderForm({ chain: { id: 137, name: 'Polygon' }})

  const submitButton = getByRole('button')
  expect(submitButton.textContent).toBe('Add Chain')
})

it('renders the correct text after the form is submitted', async () => {
  const { user, getByRole } = renderForm({ chain: { id: 137, name: 'Polygon' }})

  await user.click(getByRole('button'))

  const submitButton = getByRole('button')
  expect(submitButton.textContent).toBe('Creating')
})

it('renders a warning if the entered chain id already exists', () => {
  const { getByRole } = renderForm({ chain: { id: 1, name: 'Mainnet' }})

  const submitButton = getByRole('button')
  expect(submitButton.textContent).toMatch(/chain id already exists/i)
})

it('does not allow submit if the chain id already exists', async () => {
  const { user, getByRole } = renderForm({ chain: { id: 1, name: 'Mainnet' }})

  await user.click(getByRole('button'))

  expect(link.send).not.toHaveBeenCalled()
})

it('adds a valid chain', async () => {
  const { user, getByRole } = renderForm({
    chain: {
      id: 42162,
      type: 'ethereum',
      name: 'Arbitrum Rinkeby',
      symbol: 'ETH',
      explorer: 'https://rinkeby.arbiscan.io',
      rpcUrls: ['https://arbitrum-rinkeby.infura.com', 'https://myrpc.arbrink.net'],
      layer: 'sidechain'
    }
  })

  await user.click(getByRole('button'))

  expect(link.send).toHaveBeenNthCalledWith(1,
    'tray:addChain',
    {
      id: 42162,
      name: 'Arbitrum Rinkeby',
      symbol: 'ETH',
      explorer: 'https://rinkeby.arbiscan.io',
      type: 'ethereum',
      layer: 'sidechain',
      primaryRpc: 'https://arbitrum-rinkeby.infura.com',
      secondaryRpc: 'https://myrpc.arbrink.net'
    }
  )
})

it('resolves an add chain request after submission', async () => {
  const req = { handlerId: '1234' }
  const { user, getByRole } = renderForm({
    req,
    chain: {
      id: 137,
      name: 'Polygon'
    }
  })

  await user.click(getByRole('button'))

  expect(link.send).toHaveBeenNthCalledWith(2, 'tray:resolveRequest', req)
})

it('does not attempt to resolve an undefined request', async () => {
  const { user, getByRole } = renderForm({
    chain: {
      id: 137,
      name: 'Polygon'
    }
  })

  await user.click(getByRole('button'))

  expect(link.send).toHaveBeenCalledTimes(1)
  expect(link.send.mock.calls[0][0]).not.toBe('tray:resolveRequest')
})

// helper functions
function renderForm ({ req, chain = {} } = {}) {
  return setupComponent(<AddChain {...{req, chain} }/>)
}
