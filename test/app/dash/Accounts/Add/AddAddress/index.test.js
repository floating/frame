import React from 'react'
import Restore from 'react-restore'

import store from '../../../../../../main/store'
import link from '../../../../../../resources/link'
import { screen, render } from '../../../../../componentSetup'
import AddAdressComponent from '../../../../../../app/dash/Accounts/Add/AddAddress'

jest.mock('../../../../../../main/store/persist')
jest.mock('../../../../../../resources/link', () => ({ rpc: jest.fn() }))

const AddAddress = Restore.connect(AddAdressComponent, store)
const address = '0x690B9A9E9aa1C9dB991C7721a92d351Db4FaC990'
const ensName = 'vitalik.eth'

it('allows a user to enter an address or ENS name', async () => {
  render(<AddAddress />)

  expect(screen.getByText('input address or ENS name')).toBeTruthy()
  expect(screen.getByRole('textbox')).toBeTruthy()
})

it('adds an account by address', async () => {
  const { enterText, clickCreate } = setupComponent(<AddAddress />)

  await enterText(address)
  await clickCreate()

  expect(link.rpc).toHaveBeenCalledWith('createFromAddress', address, 'Watch Account', expect.any(Function))
})

it('shows the resolving screen when resolving an ENS name', async () => {
  const { enterText, clickCreate } = setupComponent(<AddAddress />)

  await enterText(ensName)
  await clickCreate()

  expect(screen.getByText('Resolving ENS Name')).toBeTruthy()
  expect(link.rpc).toHaveBeenCalledWith('resolveEnsName', ensName, expect.any(Function))
})

it('shows an error screen when ENS name resolution fails', async () => {
  link.rpc.mockImplementationOnce((action, name, cb) => {
    expect(action).toBe('resolveEnsName')
    expect(name).toBe('vitalik.eth')
    cb(new Error('testing!'))
  })

  const { enterText, clickCreate } = setupComponent(<AddAddress />)

  await enterText(ensName)
  await clickCreate()

  expect(screen.getByText(`Unable to resolve Ethereum address for ${ensName}`)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'try again' })).toBeTruthy()
})

it('shows a success screen after adding an account by address', async () => {
  const { enterText, clickCreate } = setupComponent(<AddAddress />)

  await enterText(address)
  await clickCreate()

  expect(screen.getByText('account added successfully')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'back' })).toBeTruthy()
})

it('shows a success screen after adding an account by ENS name', async () => {
  link.rpc.mockImplementationOnce((action, name, cb) => {
    expect(action).toBe('resolveEnsName')
    expect(name).toBe('vitalik.eth')
    cb(null, '0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
  })

  const { enterText, clickCreate } = setupComponent(<AddAddress />)

  await enterText(ensName)
  await clickCreate()

  expect(screen.getByText('account added successfully')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'back' })).toBeTruthy()
})

it('restarts when a users cancels an ENS lookup', async () => {
  const { user, enterText, clickCreate } = setupComponent(<AddAddress />)

  await enterText(ensName)
  await clickCreate()
  await user.click(screen.getByRole('button', { name: 'cancel' }))

  expect(screen.getByText('input address or ENS name')).toBeTruthy()
  expect(screen.getByRole('textbox')).toBeTruthy()
})

function setupComponent() {
  const { user } = render(<AddAddress />)

  return {
    user,
    enterText: async (text) => user.type(screen.getByLabelText('input address or ENS name'), text),
    clickCreate: async () => user.click(screen.getByRole('button', { name: 'Create' }))
  }
}
