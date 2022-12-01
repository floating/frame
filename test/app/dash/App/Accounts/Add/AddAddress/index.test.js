import React from 'react'
import Restore from 'react-restore'

import store from '../../../../../../../main/store'
import link from '../../../../../../../resources/link'
import { setupComponent } from '../../../../../../componentSetup'
import AddAdressComponent from '../../../../../../../dash/App/Accounts/Add/AddAddress'

jest.mock('../../../../../../../main/store/persist')
jest.mock('../../../../../../../resources/link', () => ({ rpc: jest.fn() }))

const AddAddress = Restore.connect(AddAdressComponent, store)
const address = '0x690B9A9E9aa1C9dB991C7721a92d351Db4FaC990'

it('adds an account by address', async () => {
  const component = setupComponent(<AddAddress />)

  await addByAccount(component)

  expect(link.rpc).toHaveBeenCalledWith('createFromAddress', address, 'Watch Account', expect.any(Function))
})

it('shows a success screen after adding an account', async () => {
  const component = setupComponent(<AddAddress />)
  const { getByText } = component

  await addByAccount(component)

  expect(getByText('account added successfully')).toBeTruthy()
})

async function addByAccount (component) {
  const { user, getByRole, getByLabelText } = component

  const inputField = getByLabelText('input address or ENS name')
  const createButton = getByRole('button', { name: 'Create' })

  await user.type(inputField, address)
  await user.click(createButton)
}
