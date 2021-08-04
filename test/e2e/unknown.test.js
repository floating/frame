import spectron from 'spectron'
import electronPath from 'electron'

const Application = spectron.Application

const frame = new Application({
  path: electronPath,
  args: ['./compiled/index.js'],
  // TODO: point this to the container's config directory so beta warning window isn't displayed
  chromeDriverArgs: ['user-data-dir=/Users/matthewholtzman/Library/Application Support/Electron']
})

async function printLogs () {
  return frame.client.getMainProcessLogs().then(logs => logs.forEach(console.log))
}

beforeAll(async () => {
  return frame.start().then(app => app.client.waitUntilWindowLoaded())
}, 30 * 1000)

afterAll(async () => frame && frame.isRunning() ? frame.stop() : true)

it('shows some windows', async () => {
  const windowCount = await frame.client.getWindowCount()

  expect(windowCount).toBe(2)
})
