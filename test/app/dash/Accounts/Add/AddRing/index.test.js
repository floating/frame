import React from 'react'
import Restore from 'react-restore'

import { render, act, screen } from '../../../../../componentSetup'
import store from '../../../../../../main/store'
import link from '../../../../../../resources/link'
import AddRingAccountComponent from '../../../../../../app/dash/Accounts/Add/AddRing'

const privateKey = '4001069d4fe9b22dc767dfa7767e72f151e00dafa05d9ef0b89069a4f04820cb'
const password = 'thisisagoodpassword123'

jest.mock('../../../../../../main/store/persist')
jest.mock('../../../../../../resources/link', () => ({
  invoke: jest.fn().mockResolvedValue({}),
  send: jest.fn(),
  rpc: jest.fn()
}))

const AddRing = Restore.connect(AddRingAccountComponent, store)

describe('entering private key', () => {
  const setupComponent = () => {
    const { user } = render(<AddRing accountData={{}} />)
    const getTitle = () => screen.getAllByRole('heading')[0]
    const getNextButton = () => screen.getAllByRole('button')[0]

    return {
      user,
      getTitle,
      getNextButton,
      enterPrivateKey: async (text) => {
        await user.type(screen.getAllByRole('textbox')[0], text)

        act(() => {
          jest.runAllTimers()
        })
      }
    }
  }

  it('should display the correct title when entering the private key', () => {
    const { getTitle } = setupComponent()

    expect(getTitle().textContent).toBe('Private Key')
  })

  it('should show an error message when private key is an invalid hex string', async () => {
    const { enterPrivateKey, getNextButton } = setupComponent()

    await enterPrivateKey('INVALID')

    expect(getNextButton().textContent).toBe('INVALID PRIVATE KEY')
  })

  it('should show an error message when private key is invalid', async () => {
    const { enterPrivateKey, getNextButton } = setupComponent()

    await enterPrivateKey('0xffffffffffffffffffffffffffffffffbaaedce6af48a03bbfd25e8cd0364148')

    expect(getNextButton().textContent).toBe('INVALID PRIVATE KEY')
  })

  it('should update the navigation with the password entry screen when a private key is submitted', async () => {
    const { user, enterPrivateKey, getNextButton } = setupComponent()

    await enterPrivateKey(privateKey)
    await user.click(getNextButton())

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
  it('should update the navigation to the confirmation screen when a password is submitted', async () => {
    const { user } = render(<AddRing accountData={{ secret: privateKey }} />)

    const passwordEntryTextArea = screen.getAllByRole('textbox')[1]
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    const confirmButton = screen.getAllByRole('button')[1]
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
  const setupComponent = () => {
    const { user } = render(<AddRing accountData={{ secret: privateKey, password }} />)
    const getConfirmButton = () => screen.getAllByRole('button')[2]

    return {
      user,
      getConfirmButton,
      enterPasswordConfirmation: async (text) => {
        await user.type(screen.getAllByRole('textbox')[2], text)

        act(() => {
          jest.runAllTimers()
        })
      }
    }
  }

  it('should try to create a private key account when a matching password is submitted', async () => {
    const { user, enterPasswordConfirmation, getConfirmButton } = setupComponent()

    await enterPasswordConfirmation(password)
    await user.click(getConfirmButton())

    expect(link.rpc).toHaveBeenCalledWith('createFromPrivateKey', privateKey, password, expect.any(Function))
  })

  it('should remove the previous screens related to adding an account from the navigation', async () => {
    link.rpc.mockImplementationOnce((action, secret, passwd, cb) => {
      expect(action).toBe('createFromPrivateKey')
      expect(secret).toBe(privateKey)
      expect(passwd).toBe(password)
      cb(null, { id: '1234' })
    })

    const { user, enterPasswordConfirmation, getConfirmButton } = setupComponent()

    await enterPasswordConfirmation(password)
    await user.click(getConfirmButton())

    expect(link.send).toHaveBeenCalledWith('nav:back', 'dash', 4)
  })

  it('should update the navigation to view the newly created account', async () => {
    link.rpc.mockImplementationOnce((action, secret, passwd, cb) => {
      expect(action).toBe('createFromPrivateKey')
      expect(secret).toBe(privateKey)
      expect(passwd).toBe(password)
      cb(null, { id: '1234' })
    })

    const { user, enterPasswordConfirmation, getConfirmButton } = setupComponent()

    await enterPasswordConfirmation(password)
    await user.click(getConfirmButton())

    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'expandedSigner',
      data: { signer: '1234' }
    })
  })
})
