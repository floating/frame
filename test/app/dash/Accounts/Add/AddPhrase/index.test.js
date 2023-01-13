import Restore from 'react-restore'

import { screen, render } from '../../../../../componentSetup'
import store from '../../../../../../main/store'
import link from '../../../../../../resources/link'
import AddPhraseAccountComponent from '../../../../../../app/dash/Accounts/Add/AddPhrase'

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
  const setupComponent = () => {
    const { user } = render(<AddPhrase accountData={{}} />, { advanceTimersAfterInput: true })

    return {
      clickNext: async () => user.click(screen.getAllByRole('button')[0]),
      enterSeedPhrase: async (text) => await user.type(screen.getAllByRole('textbox')[0], text)
    }
  }

  it('should display the correct title when entering the seed phrase', () => {
    setupComponent()

    const title = screen.getAllByRole('heading')[0]
    expect(title.textContent).toBe('Seed Phrase')
  })

  it('should show an error message when an incorrect seed phrase is submitted', async () => {
    const { enterSeedPhrase } = setupComponent()

    await enterSeedPhrase('INVALID')

    const nextButton = screen.getAllByRole('button')[0]
    expect(nextButton.textContent).toBe('INVALID SEED PHRASE')
  })

  it('should update the navigation with the password entry screen when a seed phrase is submitted', async () => {
    const { enterSeedPhrase, clickNext } = setupComponent()

    await enterSeedPhrase(phrase)
    await clickNext()

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
  it('should update the navigation to the confirmation screen when a password is submitted', async () => {
    const { user } = render(<AddPhrase accountData={{ secret: phrase }} />, { advanceTimersAfterInput: true })

    const passwordEntryTextArea = screen.getAllByRole('textbox')[1]
    const createButton = screen.getAllByRole('button')[1]

    await user.type(passwordEntryTextArea, password)
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
  const setupComponent = () => {
    const { user } = render(<AddPhrase accountData={{ secret: phrase, password }} />, {
      advanceTimersAfterInput: true
    })

    return {
      enterPassword: async (text) => user.type(screen.getAllByRole('textbox')[2], text),
      clickConfirm: async () => user.click(screen.getAllByRole('button')[2])
    }
  }

  it('should try to create seed phrase account when a matching password is submitted', async () => {
    const { enterPassword, clickConfirm } = setupComponent()

    await enterPassword(password)
    await clickConfirm()

    expect(link.rpc).toHaveBeenCalledWith('createFromPhrase', phrase, password, expect.any(Function))
  })

  it('should remove the previous screens related to adding an account from the navigation', async () => {
    const { enterPassword, clickConfirm } = setupComponent()

    link.rpc.mockImplementationOnce((action, secret, passwd, cb) => {
      expect(action).toBe('createFromPhrase')
      expect(secret).toBe(phrase)
      expect(passwd).toBe(password)
      cb(null, { id: '1234' })
    })

    await enterPassword(password)
    await clickConfirm()

    expect(link.send).toHaveBeenCalledWith('nav:back', 'dash', 4)
  })

  it('should update the navigation to view the newly created account', async () => {
    const { enterPassword, clickConfirm } = setupComponent()

    link.rpc.mockImplementationOnce((action, secret, passwd, cb) => {
      expect(action).toBe('createFromPhrase')
      expect(secret).toBe(phrase)
      expect(passwd).toBe(password)
      cb(null, { id: '1234' })
    })

    await enterPassword(password)
    await clickConfirm()

    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'expandedSigner',
      data: { signer: '1234' }
    })
  })
})
