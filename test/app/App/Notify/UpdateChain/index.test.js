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

it('renders the submit button text', () => {
  const { getByRole } = setupComponent(<UpdateChain chain={{ id: 137, name: 'Polygon' }} />)

  const submitButton = getByRole('button')
  expect(submitButton.textContent).toBe('Update Chain')
})

it('renders the correct text after the form is submitted', async () => {
  const { user, getByRole } = setupComponent(<UpdateChain chain={{ id: 137, name: 'Polygon' }} />)

  await user.click(getByRole('button'))

  const submitButton = getByRole('button')
  expect(submitButton.textContent).toBe('Updating')
})

it('does not allow a chain to be edited to have no name', async () => {
  const { user, getByRole, getByLabelText } = setupComponent(<UpdateChain chain={{ id: 137, name: 'Polygon' }} />)

  const chainNameInput = getByLabelText('Chain Name') 
  await user.clear(chainNameInput)

  const submitButton = getByRole('button')
  expect(submitButton.textContent).toMatch(/fill in chain/i)
})

it('edits the existing chain when the user clicks submit', async () => {
  const chain = {
    id: 1,
    type: 'ethereum',
    name: 'Mainnet',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    layer: 'other'
  }

  const { user, getByRole, getByLabelText } = setupComponent(<UpdateChain chain={chain} />)

  const explorerInput = getByLabelText('Block Explorer')
  await user.clear(explorerInput)
  await user.type(explorerInput, 'https://my-custom-explorer.net')
  await user.click(getByRole('button'))

  expect(link.send).toHaveBeenCalledWith('tray:action', 'updateNetwork', chain, {
    id: 1,
    name: 'Mainnet',
    symbol: 'ETH',
    explorer: 'https://my-custom-explorer.net',
    type: 'ethereum',
    layer: 'other'
  })
})
