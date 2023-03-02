import EthProvider from 'eth-provider'
import { setupBrowser } from '@testing-library/webdriverio'
import { getAllByTestId, waitFor } from '@testing-library/dom'
// import { browser } from 'wdio-electron-service'

// const { electron } = browser

describe('signing', () => {
  it('should successfully sign a message using sign_personal', async () => {
    const message = '0x' + Buffer.from('Frame Test', 'utf-8').toString('hex')
    const provider = EthProvider(['frame'])

    const sendMessage = () =>
      new Promise((resolve, reject) => {
        setTimeout(async () => {
          const [account] = await provider.request({
            method: 'eth_accounts',
            chainId: '0x5'
          })
          try {
            console.log('sending message', account)
            const signed = await provider.send('personal_sign', [message, account])
            resolve(
              JSON.stringify({ address: provider.accounts[0], msg: message, sig: signed, version: '2' })
            )
          } catch (e) {
            console.log('message send error', e)
            reject(e)
          }
        }, 2000)
      })

    const signMessage = () =>
      new Promise(async (resolve, reject) => {
        try {
          await browser.switchWindow('tray')
          const button = await $$('[data-testid=account-btn]')
          await button[0].click()

          await browser.switchWindow('dash')
          const accountsButton = await $('div=Accounts')
          accountsButton.click()
          await browser.switchWindow('dash')
          const addAccountButton = await $('[data-testid=new-item-btn]')
          await addAccountButton.waitForDisplayed()
          addAccountButton.click()
          const seedPhraseButton = await $('[data-testid=seedphrase-btn]')
          await seedPhraseButton.waitForDisplayed()
          seedPhraseButton.click()
          const seedPhraseInput = await $('textarea')
          await seedPhraseInput.setValue(
            'resist stand betray width wave actual drum merry street sentence cream law'
          )
          const nextButton = await $('[data-testid=next-btn]')
          await nextButton.waitForDisplayed({ timeout: 2000 })
          nextButton.click()
          const seedPhrasePasswordInput = await $('input[data-testid=continue-password-input]')
          await seedPhrasePasswordInput.waitForDisplayed({ timeout: 1000 })
          seedPhrasePasswordInput.click()
          await seedPhrasePasswordInput.setValue('FrameE2ETesting')
          const continueButton = await $('[data-testid=continue-btn]')
          await continueButton.waitForDisplayed({ timeout: 1000 })
          continueButton.click()

          const seedPhrasePasswordConfirmInput = await $('input[data-testid=create-password-input]')
          await seedPhrasePasswordConfirmInput.waitForDisplayed({ timeout: 1000 })
          seedPhrasePasswordConfirmInput.click()
          await seedPhrasePasswordConfirmInput.setValue('FrameE2ETesting')
          const createButton = await $('[data-testid=create-btn]')
          await createButton.waitForClickable({ timeout: 3000 })

          setTimeout(() => {
            createButton.click()
          }, 1000)

          setTimeout(async () => {
            await browser.switchWindow('tray')
            const approveRequestBtn = await $('.requestSign')
            await approveRequestBtn.waitForClickable()
            approveRequestBtn.click()
            const signBtn = await $('.requestSign')
            await signBtn.waitForClickable(10000)
            signBtn.click()
            resolve(true)
          }, 5000)
        } catch (e) {
          console.log('sign message error', e)
          reject(e)
        }
      })

    return Promise.all([sendMessage(), signMessage()])
  })
})

// test('Send Transaction', (done) => {
//   web3.eth
//     .getAccounts()
//     .then((accounts) => {
//       web3.eth
//         .sendTransaction({
//           value: Web3.utils.toHex(Math.round(1000000000000000 * Math.random())),
//           to: '0x030e6af4985f111c265ee3a279e5a9f6aa124fd5',
//           from: accounts[0]
//         })
//         .on('transactionHash', (hash) => {
//           expect(hash).toBeTruthy()
//           done()
//         })
//     })
//     .catch((err) => {
//       console.log(err)
//     })
// })

// test('eth_sign and ecRecover', (done) => {
//   const message = 'Frame Test'
//   web3.eth.getAccounts().then((accounts) => {
//     web3.eth
//       .sign(message, accounts[0])
//       .then((signed) => {
//         web3.eth.personal
//           .ecRecover(message, signed)
//           .then((result) => {
//             expect(result.toLowerCase()).toBe(accounts[0].toLowerCase())
//             console.log(JSON.stringify({ address: accounts[0], msg: message, sig: signed, version: '2' }))
//             done()
//           })
//           .catch((err) => {
//             console.log(err)
//           })
//       })
//       .catch((err) => {
//         console.log(err)
//       })
//   })
// })
