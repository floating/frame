const spectron = require('spectron')
const electronPath = require('electron')
// import { MouseEvent } from 'globalthis/implementation'

require("@nomiclabs/hardhat-waffle")

const frame = new spectron.Application({
  path: electronPath,
  args: ['./compiled'],
  // TODO: point this to the container's config directory so beta warning window isn't displayed
  chromeDriverArgs: ['user-data-dir=/Users/matthewholtzman/Library/Application Support/Electron'],
  env: {
    NODE_ENV: 'test'
  }
})

async function printLogs () {
  return frame.client.getMainProcessLogs().then(logs => logs.forEach(console.log))
}

before(async () => {
  return frame.start().then(app => app.client.waitUntilWindowLoaded())
}, 30 * 1000)

after(async () => {
  return new Promise(resolve => {
    if (!frame || !frame.isRunning) return resolve()
    setTimeout(() => resolve(frame.stop()), 100)
  })
})

it('shows some windows', async () => {
  const windowCount = await frame.client.getWindowCount()

  expect(windowCount).toBe(2)
})

it.only('sends a transaction', async () => {
  const selectNetworkDropdown = await frame.client.$('.panelMenuItemNetwork .dropdown')
  await selectNetworkDropdown.click({ button: 0 })

  const rinkeby = (await selectNetworkDropdown.$$('.dropdownItem'))[2]
  await rinkeby.waitForClickable()
  await rinkeby.click({ button: 0 })

  const openAccountButton = (await frame.client.$$('.signerSelect .signerSelectIconWrap'))[6]
  await openAccountButton.click({ button: 0 })

  const password = (await frame.client.$('input.signerUnlockInput'))
  await password.waitForDisplayed()
  await password.setValue('xN3!Yay*$093sUqw')

  const unlock = (await frame.client.$('.signerUnlockWrap .signerUnlockSubmit'))
  await unlock.waitForClickable()
  await unlock.click({ button: 0 })

  const approve = await frame.client.$('.requestApprove .requestSignButton')
  approve.waitForClickable({ timeout: 10000 }).then(() => {
    console.log('there\'s the button!')
    return approve.click({ button: 0 })
  })

  return new Promise(resolve => {
    setTimeout(() => {
      hre.run('send-tx')
        .then(async () => {

          let success, done = false
          
          while (!done) {
            success = (await frame.client.$('.txStatus > div'))
            await success.waitForDisplayed()
 
            const text = (await success.getText()) || ''

            console.log({ text })
            done = text.toLowerCase() === 'successful'
          }


          const txDetails = await frame.client.$('.txDetails.txDetailsShow')
          await txDetails.waitForClickable()
          await txDetails.click({ button: 0 })
          resolve()
          
        })
      }, 2000)
  })

  //const copiedAddress = await frame.electron.clipboard.readText()

  //expect(copiedAddress).toBe('0xe853c56864a2ebe4576a807d26fdc4a0ada51919')
}, 60 * 1000)
