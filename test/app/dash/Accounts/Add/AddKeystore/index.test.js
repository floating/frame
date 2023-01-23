import React from 'react'
import Restore from 'react-restore'
import { setupComponent } from '../../../../../componentSetup'

import store from '../../../../../../main/store'
import link from '../../../../../../resources/link'
import AddKeystoreAccountComponent from '../../../../../../app/dash/Accounts/Add/AddKeystore'
import { act } from 'react-dom/test-utils'

const keystore =
  '{"address":"0x91248de71222f40fa27f66f42ea07a6e58a259ed","crypto":{"kdf":"pbkdf2","kdfparams":{"c":262144,"dklen":32,"prf":"hmac-sha256","salt":"633bd27a4b2a8103cb7e88159bc4d97eb7a31a9a9ad2823f4365519932b63db1"},"cipher":"aes-128-ctr","ciphertext":"7cf2eda36f15bb033df75c4313a0d780ae7f80a6fb2ff0483113b1dd3b6d293e","cipherparams":{"iv":"6eccc2fcb8f5a85eb8383a71c00c889d"},"mac":"4cfdb4463acdd990d372fc68e87a3f2a393783ce92c0201d547eda17955c533b"},"id":"ce6f4a5f-0257-458b-b640-3ff5eebe5da2","version":3}'
const keystorePassword = 'keystorepassword123'

const signerPassword = 'thisisagoodpassword123'

jest.mock('../../../../../../main/store/persist')
jest.mock('../../../../../../resources/link', () => ({
  invoke: jest.fn().mockResolvedValue({}),
  send: jest.fn(),
  rpc: jest.fn()
}))

const AddKeystore = Restore.connect(AddKeystoreAccountComponent, store)

describe('selecting a keystore', () => {
  const index = 0

  it('should display any errors raised whilst selecting the keystore file', async () => {
    link.rpc.mockImplementationOnce((action, cb) => {
      expect(action).toBe('locateKeystore')
      cb('ERROR HERE')
    })

    const { user, getAllByRole } = setupComponent(<AddKeystore accountData={{}} />, {
      advanceTimersAfterInput: true
    })
    const selectKeystoreButton = getAllByRole('button')[index]

    await user.click(selectKeystoreButton)

    act(() => {
      jest.advanceTimersByTime(650)
    })

    expect(getAllByRole('button')[index].textContent).toBe('ERROR HERE')
  })

  it('should update the navigation with the keystore password entry screen when a keystore file is located', async () => {
    link.rpc.mockImplementationOnce((action, cb) => {
      expect(action).toBe('locateKeystore')
      cb(null, keystore)
    })

    const { user, getAllByRole } = setupComponent(<AddKeystore accountData={{}} />)
    const selectKeystoreButton = getAllByRole('button')[index]

    await user.click(selectKeystoreButton)

    act(() => {
      jest.runAllTimers()
    })

    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'accounts',
      data: {
        showAddAccounts: true,
        newAccountType: 'keystore',
        accountData: {
          keystore
        }
      }
    })
  })
})

describe('entering keystore password', () => {
  it('Should update the navigation to the confirmation screen when a password is submitted', async () => {
    const { user, getAllByRole } = setupComponent(<AddKeystore accountData={{ keystore }} />)
    const passwordEntryTextArea = getAllByRole('textbox')[0]

    await user.type(passwordEntryTextArea, keystorePassword)

    act(() => {
      jest.runAllTimers()
    })

    const continueButton = getAllByRole('button')[0]
    await user.click(continueButton)

    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'accounts',
      data: {
        showAddAccounts: true,
        newAccountType: 'keystore',
        accountData: {
          secret: keystore,
          creationArgs: [keystorePassword]
        }
      }
    })
  })
})

describe('entering signer password', () => {
  it('Should update the navigation to the confirmation screen when a password is submitted', async () => {
    const { user, getAllByRole } = setupComponent(<AddKeystore accountData={{ secret: keystore }} />)
    const passwordEntryTextArea = getAllByRole('textbox')[0]

    await user.type(passwordEntryTextArea, signerPassword)

    act(() => {
      jest.runAllTimers()
    })
    const createButton = getAllByRole('button')[1]
    await user.click(createButton)
    expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
      view: 'accounts',
      data: {
        showAddAccounts: true,
        newAccountType: 'keystore',
        accountData: {
          secret: keystore,
          password: signerPassword,
          creationArgs: []
        }
      }
    })
  })
})

describe('confirming signer password', () => {
  // beforeEach(() => {
  //   const component = setupComponent(
  //     <AddKeystore accountData={{ secret: keystore, password: signerPassword }} />
  //   )
  //   user = component.user
  //   passwordEntryTextArea = component.getAllByRole('textbox')[2]
  // confirmButton = component.getAllByRole('button')[2]
  // })

  it('Should try to create keystore account when a matching password is submitted', async () => {
    const { user, getAllByRole } = setupComponent(
      <AddKeystore
        accountData={{ secret: keystore, password: signerPassword, creationArgs: [keystorePassword] }}
      />
    )
    const confirmInput = getAllByRole('textbox')[1]
    const confirmButton = getAllByRole('button')[2]
    await user.type(confirmInput, signerPassword)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(confirmButton)
    expect(link.rpc).toHaveBeenCalledWith(
      'createFromKeystore',
      keystore,
      signerPassword,
      keystorePassword,
      expect.any(Function)
    )
  })

  it('Should remove the previous screens related to adding an account from the navigation', async () => {
    const { user, getAllByRole } = setupComponent(
      <AddKeystore
        accountData={{ secret: keystore, password: signerPassword, creationArgs: [keystorePassword] }}
      />
    )
    const confirmInput = getAllByRole('textbox')[1]
    const confirmButton = getAllByRole('button')[2]
    link.rpc.mockImplementationOnce((action, secret, passwd, keystorePsswd, cb) => {
      cb(null, { id: '1234' })
    })

    await user.type(confirmInput, signerPassword)

    act(() => {
      jest.runAllTimers()
    })
    await user.click(confirmButton)
    expect(link.send).toHaveBeenCalledWith('nav:back', 'dash', 6)
  })

  it('Should update the navigation to view the newly created account', async () => {
    const { user, getAllByRole } = setupComponent(
      <AddKeystore
        accountData={{ secret: keystore, password: signerPassword, creationArgs: [keystorePassword] }}
      />
    )
    const confirmInput = getAllByRole('textbox')[1]
    const confirmButton = getAllByRole('button')[2]
    link.rpc.mockImplementationOnce((action, secret, passwd, keystorePsswd, cb) => {
      cb(null, { id: '1234' })
    })

    await user.type(confirmInput, signerPassword)

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
