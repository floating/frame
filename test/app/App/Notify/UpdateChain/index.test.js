import React from 'react'
import Restore from 'react-restore'

import store from '../../../../../main/store'
import link from '../../../../../resources/link'
import { setupComponent } from '../../../../componentSetup'
import UpdateChainComponent from '../../../../../dash/App/Notify/UpdateChain'

jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link', () => ({ send: jest.fn() }))

const UpdateChain = Restore.connect(UpdateChainComponent, store)

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

it('renders the title', () => {
  const { getByRole } = setupComponent(<UpdateChain chain={{ id: 137, name: 'Polygon' }} />)

  const titleSection = getByRole('title')
  expect(titleSection.textContent).toBe('Update Chain')
})

it('renders the correct text after the form is submitted', async () => {
  const { user, getByRole } = setupComponent(<UpdateChain chain={{ id: 137, name: 'Polygon' }} />)

  await user.click(getByRole('button', { name: 'Update Chain' }))

  const submitButton = getByRole('button', { name: 'Updating' })
  expect(submitButton).toBeDefined()
})

it('does not allow a chain to be edited to have no name', async () => {
  const { user, getByRole, getByLabelText } = setupComponent(<UpdateChain chain={{ id: 137, name: 'Polygon' }} />)

  const chainNameInput = getByLabelText('Chain Name') 
  await user.clear(chainNameInput)

  const submitButton = getByRole('button', { name: /fill in chain/i })
  expect(submitButton).toBeDefined()
})

it('edits the existing chain when the user clicks submit', async () => {
  const chain = {
    id: 1,
    type: 'ethereum',
    name: 'Mainnet',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    isTestnet: false
  }

  const { user, getByRole, getByLabelText } = setupComponent(<UpdateChain chain={chain} />)

  const explorerInput = getByLabelText('Block Explorer')
  await user.clear(explorerInput)
  await user.type(explorerInput, 'https://my-custom-explorer.net')
  await user.click(getByRole('button', { name: 'Update Chain' }))

  expect(link.send).toHaveBeenCalledWith('tray:action', 'updateNetwork', chain, {
    id: 1,
    name: 'Mainnet',
    symbol: 'ETH',
    explorer: 'https://my-custom-explorer.net',
    type: 'ethereum',
    isTestnet: false
  })
})

it('opens a confirmation when removing a chain', async () => {
  const chain = {
    id: 1,
    type: 'ethereum',
    name: 'Mainnet',
    symbol: 'ETH',
    explorer: 'https://etherscan.io'
  }

  const { user, getByRole } = setupComponent(<UpdateChain chain={chain} />)

  await user.click(getByRole('button', { name: 'Remove Chain' }))

  expect(link.send).toHaveBeenCalledWith(
    'tray:action',
    'navDash',
    {
      view: 'notify',
      data: {
        notify: 'confirmRemoveChain',
        notifyData: { chain }
      }
    }
  )
})
