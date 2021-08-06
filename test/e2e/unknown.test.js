const spectron = require('spectron')
const electronPath = require('electron')

const { expect } = require('chai')


const frame = new spectron.Application({
  // built version: path: '/Applications/Frame.app/Contents/MacOS/Frame'
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

it.only('sends a transaction', async function () {
  this.timeout(30 * 1000)
  // const selectNetworkDropdown = await frame.client.$('.panelMenuItemNetwork .dropdown')
  // await selectNetworkDropdown.click({ button: 0 })

  // const rinkeby = (await selectNetworkDropdown.$$('.dropdownItem'))[2]
  // await rinkeby.waitForClickable()
  // await rinkeby.click({ button: 0 })

  const openAccountButton = (await frame.client.$$('.signerSelect .signerSelectIconWrap'))[0]
  await openAccountButton.waitForClickable()
  await openAccountButton.click({ button: 0 })

  const password = (await frame.client.$('input.signerUnlockInput'))
  await password.waitForDisplayed()
  await password.setValue('letstesthardhat')

  const unlock = (await frame.client.$('.signerUnlockWrap .signerUnlockSubmit'))
  await unlock.waitForClickable()
  await unlock.click({ button: 0 })

  const txAmount = '.0006'

  return new Promise((resolve, reject) => {
    const submitTx = new Promise(submitted => {
      setTimeout(() => {
        hre.run('send-tx', { amount: txAmount }).then(async txHash => {
          const tx = await hre.ethers.provider.waitForTransaction(txHash, 1)
          const minedTx = await hre.ethers.provider.getTransaction(tx.transactionHash)

          console.log(`transaction ${txHash} was included in block ${tx.blockNumber}`)

          expect(tx.blockNumber).to.be.ok
          expect(minedTx.value.eq(hre.ethers.utils.parseEther(txAmount))).to.be.true

          resolve()
          
        }).catch(reject)

        submitted()
      }, 500)
    })

    submitTx.then(async () => {
      const approve = await frame.client.$('.requestApprove .requestSignButton')
      await approve.waitUntil(() => new Promise(r => setTimeout(() => r(true), 2000)))
      await approve.waitForClickable()
      await approve.click({ button: 0 })
    })
  })
})
