import spectron from 'spectron'
import electronPath from 'electron'
import { MouseEvent } from 'globalthis/implementation'

const frame = new spectron.Application({
  path: electronPath,
  args: ['./compiled'],
  // TODO: point this to the container's config directory so beta warning window isn't displayed
  chromeDriverArgs: ['user-data-dir=/Users/matthewholtzman/Library/Application Support/Electron']
})

async function printLogs () {
  return frame.client.getMainProcessLogs().then(logs => logs.forEach(console.log))
}

beforeAll(async () => {
  return frame.start().then(app => app.client.waitUntilWindowLoaded())
}, 30 * 1000)

afterAll(async () => {
  return new Promise(resolve => {
    if (!frame || !frame.isRunning) return resolve()
    setTimeout(() => resolve(frame.stop()), 100)
  })
})

it('shows some windows', async () => {
  const windowCount = await frame.client.getWindowCount()

  expect(windowCount).toBe(2)
})

it('copies an account address', async () => {
  const addressDisplay = await frame.client.$('.transactionToAddressLargeWrap')
  addressDisplay.moveTo({ xOffset: 5, yOffset: 5 })

  const fullAddress = await frame.client.$('.transactionToAddressFull')
  fullAddress.click({ button: 0 })

  const copiedAddress = await frame.electron.clipboard.readText()

  expect(copiedAddress).toBe('0xe853c56864a2ebe4576a807d26fdc4a0ada51919')
})
