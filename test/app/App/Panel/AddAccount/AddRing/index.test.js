import React from 'react'
import Restore from 'react-restore'
import { setupComponent } from '../../../../../componentSetup'

import store from '../../../../../../main/store'
import link from '../../../../../../resources/link'
import AddRingAccountComponent from '../../../../../../dash/App/Accounts/Add/AddRing'
import { act } from 'react-dom/test-utils'

const privateKey = '0x01'
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
  let user, getByTestId, privateKeyTextArea, nextButton

  beforeEach(() => {
    ;({ user, getByTestId } = setupComponent(<AddRing accountData={{}} />))
    privateKeyTextArea = getByTestId('addHotAccountSecretTextEntry')
    nextButton = getByTestId('addHotAccountSecretSubmitButton')
  })

  it('should display the correct title when entering the private key', () => {
    const title = getByTestId('addHotAccountSecretTitle')
    expect(title.textContent).toBe('Private Key')
  })

  it('should show an error message when private key is an invalid hex string', async () => {
    await user.type(privateKeyTextArea, 'INVALID')
    await user.click(nextButton)
    const errorMessage = getByTestId('addHotAccountSecretError')
    expect(errorMessage.textContent).toBe('INVALID PRIVATE KEY')
  })

  it('should show an error message when private key is invalid', async () => {
    await user.type(privateKeyTextArea, '0xffffffffffffffffffffffffffffffffbaaedce6af48a03bbfd25e8cd0364148')
    await user.click(nextButton)
    const errorMessage = getByTestId('addHotAccountSecretError')
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
    const { user, getByTestId, queryByTestId } = setupComponent(
      <AddRing accountData={{ secret: privateKey }} />
    )
    const passwordEntryTextArea = getByTestId('createPasswordInput')
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(queryByTestId('createPasswordButton'))
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
  let user, getByTestId, queryByTestId, passwordEntryTextArea

  beforeEach(() => {
    ;({ user, getByTestId, queryByTestId } = setupComponent(
      <AddRing accountData={{ secret: privateKey, password }} />
    ))
    passwordEntryTextArea = getByTestId('createPasswordInput')
  })

  it('Should try to create a private key account when a matching password is submitted', async () => {
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(queryByTestId('createPasswordButton'))
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

    await user.click(queryByTestId('createPasswordButton'))
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

    await user.click(queryByTestId('createPasswordButton'))
    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'expandedSigner',
      data: { signer: '1234' }
    })
  })
})
