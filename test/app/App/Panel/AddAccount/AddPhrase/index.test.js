import React from 'react'
import Restore from 'react-restore'
import { setupComponent } from '../../../../../componentSetup'

import store from '../../../../../../main/store'
import link from '../../../../../../resources/link'
import AddPhraseAccountComponent from '../../../../../../dash/App/Accounts/Add/AddPhrase'
import { act } from 'react-dom/test-utils'

const phrase = 'there lab weapon cost bounce smart trial pulse ceiling beach upset hockey illegal chef leaf'
const password = 'thisisagoodpassword123'

jest.mock('../../../../../../main/store/persist')
jest.mock('../../../../../../resources/link', () => ({
  invoke: jest.fn().mockResolvedValue({}),
  send: jest.fn(),
  rpc: jest.fn()
}))
jest.useFakeTimers()

const AddPhrase = Restore.connect(AddPhraseAccountComponent, store)

describe('entering seed phrase', () => {
  let user, getByTestId, seedPhraseTextArea, nextButton

  beforeEach(() => {
    ;({ user, getByTestId } = setupComponent(<AddPhrase accountData={{}} />))
    seedPhraseTextArea = getByTestId('addHotAccountSecretTextEntry')
    nextButton = getByTestId('addHotAccountSecretSubmitButton')
  })

  it('should display the correct title when entering the seed phrase', () => {
    const title = getByTestId('addHotAccountSecretTitle')
    expect(title.textContent).toBe('Seed Phrase')
  })

  it('should show an error message when an incorrect seed phrase is submitted', async () => {
    await user.type(seedPhraseTextArea, 'INVALID')
    await user.click(nextButton)
    const errorMessage = getByTestId('addHotAccountSecretError')
    expect(errorMessage.textContent).toBe('INVALID SEED PHRASE')
  })

  it('should update the navigation with the password entry screen when a seed phrase is submitted', async () => {
    await user.type(seedPhraseTextArea, phrase)
    await user.click(nextButton)

    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'accounts',
      data: {
        showAddAccounts: true,
        newAccountType: 'seed',
        accountData: {
          secret: phrase
        }
      }
    })
  })
})

describe('entering password', () => {
  it('Should update the navigation to the confirmation screen when a password is submitted', async () => {
    const { user, getByTestId, queryByTestId } = setupComponent(
      <AddPhrase accountData={{ secret: phrase }} />
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
        newAccountType: 'seed',
        accountData: {
          secret: phrase,
          password
        }
      }
    })
  })
})

describe('confirming password', () => {
  let component, passwordEntryTextArea

  beforeEach(() => {
    component = setupComponent(<AddPhrase accountData={{ secret: phrase, password }} />)
    passwordEntryTextArea = component.getByTestId('createPasswordInput')
  })

  it('Should try to create seed phrase account when a matching password is submitted', async () => {
    const { user } = component

    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(component.queryByTestId('createPasswordButton'))
    expect(link.rpc).toHaveBeenCalledWith('createFromPhrase', phrase, password, expect.any(Function))
  })

  it('Should remove the previous screens related to adding an account from the navigation', async () => {
    link.rpc.mockImplementationOnce((action, secret, passwd, cb) => {
      expect(action).toBe('createFromPhrase')
      expect(secret).toBe(phrase)
      expect(passwd).toBe(password)
      cb(null, { id: '1234' })
    })

    const { user } = component

    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(component.queryByTestId('createPasswordButton'))
    expect(link.send).toHaveBeenCalledWith('nav:back', 'dash', 4)
  })

  it('Should update the navigation to view the newly created account', async () => {
    link.rpc.mockImplementationOnce((action, secret, passwd, cb) => {
      expect(action).toBe('createFromPhrase')
      expect(secret).toBe(phrase)
      expect(passwd).toBe(password)
      cb(null, { id: '1234' })
    })

    const { user } = component

    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(component.queryByTestId('createPasswordButton'))
    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'expandedSigner',
      data: { signer: '1234' }
    })
  })
})
