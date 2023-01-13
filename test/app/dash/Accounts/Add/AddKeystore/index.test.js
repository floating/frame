// import React from 'react'
// import Restore from 'react-restore'
// import { setupComponent } from '../../../../../componentSetup'

// import store from '../../../../../../main/store'
// import link from '../../../../../../resources/link'
// import AddKeystoreAccountComponent from '../../../../../../app/dash/Accounts/Add/AddKeystore'
// import { act } from 'react-dom/test-utils'

// const keystore = {
//   address: '0x064f5620a978a2f404fad6eee83e48b30e5ce38d',
//   crypto: {
//     kdf: 'pbkdf2',
//     kdfparams: {
//       c: 262144,
//       dklen: 32,
//       prf: 'hmac-sha256',
//       salt: '5823c65731631f746894b474cae6c030bec5958cba3b1bbd4b735badac876930'
//     },
//     cipher: 'aes-128-ctr',
//     ciphertext: '9fce0492886b4cd35d9e48b1ae9c3fba756446c2ba3793685327e6c8e6f751f8',
//     cipherparams: { iv: '42d27a77bcfcdababdb0acd14ad2738a' },
//     mac: 'dc38837b5707b9a8947c2821e9177947c459a9ac061f514ef13dd62b0aae32e7'
//   },
//   id: 'c85ff8f5-a927-4dad-be1b-a43a19efa77e',
//   version: 3
// }
// const keystorePassword = 'ev5QRBY72rCL3Yy'
// const password = 'thisisagoodpassword123'

// jest.mock('../../../../../../main/store/persist')
// jest.mock('../../../../../../resources/link', () => ({
//   invoke: jest.fn().mockResolvedValue({}),
//   send: jest.fn(),
//   rpc: jest.fn()
// }))

// const AddKeystore = Restore.connect(AddKeystoreAccountComponent, store)

// // describe('Selecting Keystore file', () => {
// //   const index = 0
// //   let user, privateKeyTextArea, nextButton, getAllByRole

// //   beforeEach(() => {
// //     const component = setupComponent(<AddKeystore accountData={{}} />)
// //     ;({ user, getAllByRole } = component)
// //     privateKeyTextArea = component.getAllByRole('textbox')[index]
// //     nextButton = component.getAllByRole('button')[index]
// //   })

// //   it('should display the correct title when entering the private key', () => {
// //     const title = getAllByRole('heading')[index]
// //     expect(title.textContent).toBe('Private Key')
// //   })

// //   it('should show an error message when private key is an invalid hex string', async () => {
// //     await user.type(privateKeyTextArea, 'INVALID')

// //     act(() => {
// //       jest.runAllTimers()
// //     })

// //     expect(nextButton.textContent).toBe('INVALID PRIVATE KEY')
// //   })

// //   it('should show an error message when private key is invalid', async () => {
// //     await user.type(privateKeyTextArea, '0xffffffffffffffffffffffffffffffffbaaedce6af48a03bbfd25e8cd0364148')

// //     act(() => {
// //       jest.runAllTimers()
// //     })

// //     expect(nextButton.textContent).toBe('INVALID PRIVATE KEY')
// //   })

// //   it('should update the navigation with the password entry screen when a private key is submitted', async () => {
// //     await user.type(privateKeyTextArea, keystore)

// //     act(() => {
// //       jest.runAllTimers()
// //     })

// //     await user.click(nextButton)

// //     expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
// //       view: 'accounts',
// //       data: {
// //         showAddAccounts: true,
// //         newAccountType: 'keyring',
// //         accountData: {
// //           secret: keystore
// //         }
// //       }
// //     })
// //   })
// // })

// describe('entering signer password', () => {
//   it('Should update the navigation to the confirmation screen when a password is submitted', async () => {
//     const { user, getAllByRole } = setupComponent(
//       <AddKeystore accountData={{ secret: keystore, creationArgs: [keystorePassword] }} />
//     )
//     const passwordEntryTextArea = getAllByRole('textbox')[1]
//     await user.type(passwordEntryTextArea, password)

//     act(() => {
//       jest.runAllTimers()
//     })
//     const confirmButton = getAllByRole('button')[1]
//     await user.click(confirmButton)
//     expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
//       view: 'accounts',
//       data: {
//         showAddAccounts: true,
//         newAccountType: 'keystore',
//         accountData: {
//           secret: keystore,
//           password,
//           creationArgs: []
//         }
//       }
//     })
//   })
// })

// describe('confirming signer password', () => {
//   let user, passwordEntryTextArea, confirmButton

//   beforeEach(() => {
//     const component = setupComponent(
//       <AddKeystore accountData={{ secret: keystore, password, creationArgs: [keystorePassword] }} />
//     )
//     user = component.user
//     passwordEntryTextArea = component.getAllByRole('textbox')[2]
//     confirmButton = component.getAllByRole('button')[2]
//   })

//   it('Should try to create a private key account when a matching password is submitted', async () => {
//     await user.type(passwordEntryTextArea, password)

//     act(() => {
//       jest.runAllTimers()
//     })

//     await user.click(confirmButton)
//     expect(link.rpc).toHaveBeenCalledWith(
//       'createFromKeystore',
//       keystore,
//       password,
//       keystorePassword,
//       expect.any(Function)
//     )
//   })

//   it('Should remove the previous screens related to adding an account from the navigation', async () => {
//     link.rpc.mockImplementationOnce((action, secret, passwd, keystorePwd, cb) => {
//       expect(action).toBe('createFromKeystore')
//       expect(secret).toBe(keystore)
//       expect(passwd).toBe(password)
//       expect(keystorePwd).toBe(keystorePassword)
//       cb(null, { id: '1234' })
//     })

//     await user.type(passwordEntryTextArea, password)

//     act(() => {
//       jest.runAllTimers()
//     })

//     await user.click(confirmButton)
//     expect(link.send).toHaveBeenCalledWith('nav:back', 'dash', 4)
//   })

//   it('Should update the navigation to view the newly created account', async () => {
//     link.rpc.mockImplementationOnce((action, secret, passwd, keystorePwd, cb) => {
//       expect(action).toBe('createFromKeystore')
//       expect(secret).toBe(keystore)
//       expect(passwd).toBe(password)
//       expect(keystorePwd).toBe(keystorePassword)
//       cb(null, { id: '1234' })
//     })

//     await user.type(passwordEntryTextArea, password)

//     act(() => {
//       jest.runAllTimers()
//     })

//     await user.click(confirmButton)
//     expect(link.send).toHaveBeenCalledWith('nav:forward', 'dash', {
//       view: 'expandedSigner',
//       data: { signer: '1234' }
//     })
//   })
// })
