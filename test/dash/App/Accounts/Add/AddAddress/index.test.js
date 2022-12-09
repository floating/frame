import React from 'react'
import Restore from 'react-restore'

import store from '../../../../../../main/store'
import link from '../../../../../../resources/link'
import { setupComponent } from '../../../../../componentSetup'
import AddAdressComponent from '../../../../../../dash/App/Accounts/Add/AddAddress'

jest.mock('../../../../../../main/store/persist')
jest.mock('../../../../../../resources/link', () => ({ rpc: jest.fn() }))

const AddAddress = Restore.connect(AddAdressComponent, store)
const address = '0x690B9A9E9aa1C9dB991C7721a92d351Db4FaC990'
const ensName = 'vitalik.eth'

it('allows a user to enter an address or ENS name', async () => {
  const { getByText, getByRole } = setupComponent(<AddAddress />)

  expect(getByText('input address or ENS name')).toBeTruthy()
  expect(getByRole('textbox')).toBeTruthy()
})

it('adds an account by address', async () => {
  const component = setupComponent(<AddAddress />)

  await addByAccount(component)

  expect(link.rpc).toHaveBeenCalledWith('createFromAddress', address, 'Watch Account', expect.any(Function))
})

it('shows the resolving screen when resolving an ENS name', async () => {
  const component = setupComponent(<AddAddress />)
  const { getByText } = component

  await addByEnsName(component)

  expect(getByText('Resolving ENS Name')).toBeTruthy()
  expect(link.rpc).toHaveBeenCalledWith('resolveEnsName', ensName, expect.any(Function))
})

it('shows an error screen when ENS name resolution fails', async () => {
  link.rpc.mockImplementationOnce((action, name, cb) => {
    expect(action).toBe('resolveEnsName')
    expect(name).toBe('vitalik.eth')
    cb(new Error('testing!'))
  })

  const component = setupComponent(<AddAddress />)
  const { getByText, getByRole } = component

  await addByEnsName(component)

  expect(getByText(`Unable to resolve Ethereum address for ${ensName}`)).toBeTruthy()
  expect(getByRole('button', { name: 'try again' })).toBeTruthy()
})

it('shows a success screen after adding an account by address', async () => {
  const component = setupComponent(<AddAddress />)
  const { getByText, getByRole } = component

  await addByAccount(component)

  expect(getByText('account added successfully')).toBeTruthy()
  expect(getByRole('button', { name: 'back' })).toBeTruthy()
})

it('shows a success screen after adding an account by ENS name', async () => {
  link.rpc.mockImplementationOnce((action, name, cb) => {
    expect(action).toBe('resolveEnsName')
    expect(name).toBe('vitalik.eth')
    cb(null, '0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
  })

  const component = setupComponent(<AddAddress />)
  const { getByText, getByRole } = component

  await addByEnsName(component)

  expect(getByText('account added successfully')).toBeTruthy()
  expect(getByRole('button', { name: 'back' })).toBeTruthy()
})

it('restarts when a users cancels an ENS lookup', async () => {
  const component = setupComponent(<AddAddress />)
  const { user, getByText, getByRole } = component

  await addByEnsName(component)
  await user.click(getByRole('button', { name: 'cancel' }))

  expect(getByText('input address or ENS name')).toBeTruthy()
  expect(getByRole('textbox')).toBeTruthy()
})

async function addByAccount(component) {
  const { user, getByRole, getByLabelText } = component

  const inputField = getByLabelText('input address or ENS name')
  const createButton = getByRole('button', { name: 'Create' })

  await user.type(inputField, address)
  await user.click(createButton)
}

async function addByEnsName(component) {
  const { user, getByRole, getByLabelText } = component

  const inputField = getByLabelText('input address or ENS name')
  const createButton = getByRole('button', { name: 'Create' })

  await user.type(inputField, ensName)
  await user.click(createButton)
}
