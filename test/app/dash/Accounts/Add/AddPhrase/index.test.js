import React from 'react'
import Restore from 'react-restore'
import { setupComponent } from '../../../../../componentSetup'

import store from '../../../../../../main/store'
import link from '../../../../../../resources/link'
import AddPhraseAccountComponent from '../../../../../../app/dash/Accounts/Add/AddPhrase'
import { act } from 'react-dom/test-utils'

const phrase = 'there lab weapon cost bounce smart trial pulse ceiling beach upset hockey illegal chef leaf'
const password = 'thisisagoodpassword123'

jest.mock('../../../../../../main/store/persist')
jest.mock('../../../../../../resources/link', () => ({
  invoke: jest.fn().mockResolvedValue({}),
  send: jest.fn(),
  rpc: jest.fn()
}))

const AddPhrase = Restore.connect(AddPhraseAccountComponent, store)

describe('entering seed phrase', () => {
  const index = 0
  let user, seedPhraseTextArea, nextButton, getAllByRole

  beforeEach(() => {
    const component = setupComponent(<AddPhrase accountData={{}} />)
    ;({ user, getAllByRole } = component)
    seedPhraseTextArea = component.getAllByRole('textbox')[index]
    nextButton = component.getAllByRole('button')[index]
  })

  it('should display the correct title when entering the seed phrase', () => {
    const title = getAllByRole('heading')[index]
    expect(title.textContent).toBe('Seed Phrase')
  })

  it('should show an error message when an incorrect seed phrase is submitted', async () => {
    await user.type(seedPhraseTextArea, 'INVALID')

    act(() => {
      jest.runAllTimers()
    })

    expect(nextButton.textContent).toBe('INVALID SEED PHRASE')
  })

  it('should update the navigation with the password entry screen when a seed phrase is submitted', async () => {
    await user.type(seedPhraseTextArea, phrase)

    act(() => {
      jest.runAllTimers()
    })

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
    const { user, getAllByRole } = setupComponent(<AddPhrase accountData={{ secret: phrase }} />)
    const passwordEntryTextArea = getAllByRole('textbox')[1]

    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })
    const createButton = getAllByRole('button')[1]
    await user.click(createButton)
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
  let user, passwordEntryTextArea, confirmButton

  beforeEach(() => {
    const component = setupComponent(<AddPhrase accountData={{ secret: phrase, password }} />)
    user = component.user
    passwordEntryTextArea = component.getAllByRole('textbox')[2]
    confirmButton = component.getAllByRole('button')[2]
  })

  it('Should try to create seed phrase account when a matching password is submitted', async () => {
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(confirmButton)
    expect(link.rpc).toHaveBeenCalledWith('createFromPhrase', phrase, password, expect.any(Function))
  })

  it('Should remove the previous screens related to adding an account from the navigation', async () => {
    link.rpc.mockImplementationOnce((action, secret, passwd, cb) => {
      expect(action).toBe('createFromPhrase')
      expect(secret).toBe(phrase)
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
      expect(action).toBe('createFromPhrase')
      expect(secret).toBe(phrase)
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
