import ethProvider from 'eth-provider'
import log from 'electron-log'
import { ipcMain as ipc } from 'electron'

//import provider from '../../main/provider'

jest.mock('@sentry/electron')

jest.mock('../../main/windows', () => ({}))
jest.mock('../../main/windows/nav', () => ({}))
jest.mock('../../main/signers', () => ({}))
jest.mock('../../main/dapps', () => ({ add: jest.fn() }))
jest.mock('../../main/externalData')
jest.mock('../../main/updater')
jest.mock('../../main/launch', () => ({}))

//jest.mock('electron')

let connection

async function startApp () {
  await import('../../main')
  ipc.emit('tray:ready')
}

beforeAll(async () => {
  log.transports.console.level = false
  jest.useRealTimers()
  
  await startApp()
  // const provider = (await import('../../main/provider')).default

  // return new Promise((resolve) => {
  //   if (provider.connected) {
  //     console.log('provider already connected!')
  //     return resolve()
  //   }

  //   provider.on('connect', () => {
  //     console.log('provider connected!')
  //     resolve()
  //   })
  // })
  
})

beforeEach((done) => {
  // console.log('STARTING BEFORE EACH')

  connection = ethProvider('ws://127.0.0.1:1248', { origin: 'test.frame.eth' })

  connection.on('connect', () => {
    console.log(`[${new Date().toString()}] eth provider connected!`)
    done()
  })
})

afterEach((done) => {
  connection.on('close', done)
  connection.close()
})

it('accepts a request', async () => {
  const request = connection.request({ method: 'eth_chainId' })
  return expect(request).resolves.toBe('0x1')
})
