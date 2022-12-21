import React from 'react'
import Restore from 'react-restore'
import { setupComponent } from '../../../../../componentSetup'

import store from '../../../../../../main/store'
import link from '../../../../../../resources/link'
import AddRingAccountComponent from '../../../../../../dash/App/Accounts/Add/AddRing'
import { act } from 'react-dom/test-utils'

const privateKey = '4001069d4fe9b22dc767dfa7767e72f151e00dafa05d9ef0b89069a4f04820cb'
const password = 'thisisagoodpassword123'

jest.mock('../../../../../../main/store/persist')
jest.mock('../../../../../../resources/link', () => ({
  invoke: jest.fn().mockResolvedValue({}),
  send: jest.fn(),
  rpc: jest.fn()
}))
jest.useFakeTimers()

const AddRing = Restore.connect(AddRingAccountComponent, store)

describe('entering private key', () => {
  const index = 0
  let user, getByRole, privateKeyTextArea, nextButton, getAllByRole

  beforeEach(() => {
    ;({ user, getByRole, getAllByRole } = setupComponent(<AddRing accountData={{}} />))
    privateKeyTextArea = getAllByRole('textbox')[index]
    nextButton = getAllByRole('button')[index]
  })

  it('should display the correct title when entering the private key', () => {
    const title = getAllByRole('heading')[index]
    expect(title.textContent).toBe('Private Key')
  })

  it('should show an error message when private key is an invalid hex string', async () => {
    await user.type(privateKeyTextArea, 'INVALID')
    await user.click(nextButton)
    const errorMessage = getByRole('alert')
    expect(errorMessage.textContent).toBe('INVALID PRIVATE KEY')
  })

  it('should show an error message when private key is invalid', async () => {
    await user.type(privateKeyTextArea, '0xffffffffffffffffffffffffffffffffbaaedce6af48a03bbfd25e8cd0364148')
    await user.click(nextButton)
    const errorMessage = getByRole('alert')
    expect(errorMessage.textContent).toBe('INVALID PRIVATE KEY')
  })

  it('should update the navigation with the password entry screen when a private key is submitted', async () => {
    await user.type(privateKeyTextArea, privateKey)
    await user.click(nextButton)

    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'accounts',
      data: {
        showAddAccounts: true,
        newAccountType: 'keyring',
        accountData: {
          secret: privateKey
        }
      }
    })
  })
})

describe('entering password', () => {
  it('Should update the navigation to the confirmation screen when a password is submitted', async () => {
    const { user, getAllByRole } = setupComponent(<AddRing accountData={{ secret: privateKey }} />)
    const passwordEntryTextArea = getAllByRole('textbox')[1]
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })
    const confirmButton = getAllByRole('button')[1]
    await user.click(confirmButton)
    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'accounts',
      data: {
        showAddAccounts: true,
        newAccountType: 'keyring',
        accountData: {
          secret: privateKey,
          password
        }
      }
    })
  })
})

describe('confirming password', () => {
  let user, passwordEntryTextArea, confirmButton

  beforeEach(() => {
    const component = setupComponent(<AddRing accountData={{ secret: privateKey, password }} />)
    user = component.user
    passwordEntryTextArea = component.getAllByRole('textbox')[2]
    confirmButton = component.getAllByRole('button')[2]
  })

  it('Should try to create a private key account when a matching password is submitted', async () => {
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(confirmButton)
    expect(link.rpc).toHaveBeenCalledWith('createFromPrivateKey', privateKey, password, expect.any(Function))
  })

  it('Should remove the previous screens related to adding an account from the navigation', async () => {
    link.rpc.mockImplementationOnce((action, secret, passwd, cb) => {
      expect(action).toBe('createFromPrivateKey')
      expect(secret).toBe(privateKey)
      expect(passwd).toBe(password)
      cb(null, { id: '1234' })
    })

    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(confirmButton)
    expect(link.send).toHaveBeenCalledWith('nav:back', 'dash', 4)
  })

  it('Should update the navigation to view the newly created account', async () => {
    link.rpc.mockImplementationOnce((action, secret, passwd, cb) => {
      expect(action).toBe('createFromPrivateKey')
      expect(secret).toBe(privateKey)
      expect(passwd).toBe(password)
      cb(null, { id: '1234' })
    })

    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(confirmButton)
    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'expandedSigner',
      data: { signer: '1234' }
    })
  })
})
