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
  let user, getByTestId, seedPhraseTextArea, nextButton

  beforeEach(() => {
    ;({ user, getByTestId } = setupComponent(<AddRing accountData={{}} />))
    seedPhraseTextArea = getByTestId('addHotAccountSecretTextEntry')
    nextButton = getByTestId('addHotAccountSecretSubmitButton')
  })

  it('should display the correct title when entering the seed phrase', () => {
    const title = getByTestId('addHotAccountSecretTitle')
    expect(title.textContent).toBe('Private Key')
  })

  it('should show an error message when an incorrect seed phrase is submitted', async () => {
    await user.type(seedPhraseTextArea, 'INVALID')
    await user.click(nextButton)
    const errorMessage = getByTestId('addHotAccountSecretError')
    expect(errorMessage.textContent).toBe('INVALID PRIVATE KEY')
  })

  it('should update the navigation with the password entry screen when a seed phrase is submitted', async () => {
    await user.type(seedPhraseTextArea, privateKey)
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
  let component, passwordEntryTextArea

  beforeEach(() => {
    component = setupComponent(<AddRing accountData={{ secret: privateKey }} />)
    passwordEntryTextArea = component.getByTestId('addHotAccountCreatePasswordInput')
  })

  it('Should display the correct title when entering the password', () => {
    expect(component.getByTestId('addHotAccountCreatePasswordTitle').textContent).toBe('Create Password')
  })

  it('Should not show the `next` button until a valid password is entered', () => {
    expect(component.queryByTestId('addHotAccountPasswordSubmitButton')).toBeFalsy()
  })

  it('Should debounce password feedback', async () => {
    const { user } = component
    await user.type(passwordEntryTextArea, 'INVALID')
    expect(component.queryByTestId('addHotAccountCreatePasswordError')).toBeFalsy()

    act(() => {
      jest.runAllTimers()
    })

    expect(component.queryByTestId('addHotAccountCreatePasswordError').textContent).toBeTruthy()
  })

  it('Should show an error when the password is too short', async () => {
    const { user } = component
    await user.type(passwordEntryTextArea, 'INVALID')

    act(() => {
      jest.runAllTimers()
    })

    expect(component.getByTestId('addHotAccountCreatePasswordError').textContent).toBe(
      'PASSWORD MUST BE AT LEAST 12 CHARACTERS LONG'
    )
  })

  it('Should show the warning when the password is too weak', async () => {
    const { user } = component
    await user.type(passwordEntryTextArea, 'aaaaaaaaaaaa')

    act(() => {
      jest.runAllTimers()
    })

    expect(component.getByTestId('addHotAccountCreatePasswordError').textContent).toBe(
      'REPEATS LIKE "AAA" ARE EASY TO GUESS'
    )
  })

  it('Should show the continue button when a valid password is entered', async () => {
    const { user } = component
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    expect(component.queryByTestId('addHotAccountCreatePasswordError')).toBeFalsy()
    expect(component.getByTestId('addHotAccountPasswordSubmitButton').textContent).toBe('Continue')
  })

  it('Should update the navigation to the confirmation screen when a password is submitted', async () => {
    const { user } = component

    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(component.queryByTestId('addHotAccountPasswordSubmitButton'))
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
  let component, passwordEntryTextArea

  beforeEach(() => {
    component = setupComponent(<AddRing accountData={{ secret: privateKey, password }} />)
    passwordEntryTextArea = component.getByTestId('addHotAccountCreatePasswordInput')
  })

  it('Should show an error when the password does not match previously entered password', async () => {
    const { user } = component
    await user.type(passwordEntryTextArea, 'DOES_NOT_MATCH')
    expect(component.queryByTestId('addHotAccountCreatePasswordError')).toBeFalsy()

    act(() => {
      jest.runAllTimers()
    })

    expect(component.queryByTestId('addHotAccountCreatePasswordError').textContent).toBeTruthy()
  })

  it('Should show the create button when a valid password is entered', async () => {
    const { user } = component
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    expect(component.queryByTestId('addHotAccountCreatePasswordError')).toBeFalsy()
    expect(component.getByTestId('addHotAccountPasswordSubmitButton').textContent).toBe('create')
  })

  it('Should try to create an account when a matching password is submitted', async () => {
    const { user } = component

    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(component.queryByTestId('addHotAccountPasswordSubmitButton'))
    expect(link.rpc).toHaveBeenCalledWith('createFromPrivateKey', privateKey, password, expect.any(Function))
  })

  it('Should remove the previous screens related to adding an account from the navigation', async () => {
    link.rpc.mockImplementationOnce((action, secret, passwd, cb) => {
      expect(action).toBe('createFromPrivateKey')
      expect(secret).toBe(privateKey)
      expect(passwd).toBe(password)
      cb(null, { id: '1234' })
    })

    const { user } = component

    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(component.queryByTestId('addHotAccountPasswordSubmitButton'))
    expect(link.send).toHaveBeenCalledWith('nav:back', 'dash', 4)
  })

  it('Should update the navigation to view the newly created account', async () => {
    link.rpc.mockImplementationOnce((action, secret, passwd, cb) => {
      expect(action).toBe('createFromPrivateKey')
      expect(secret).toBe(privateKey)
      expect(passwd).toBe(password)
      cb(null, { id: '1234' })
    })

    const { user } = component

    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(component.queryByTestId('addHotAccountPasswordSubmitButton'))
    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'expandedSigner',
      data: { signer: '1234' }
    })
  })
})
