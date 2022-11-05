import ethProvider from 'eth-provider'
import log from 'electron-log'
import { ipcMain as ipc } from 'electron'

//import provider from '../../main/provider'

jest.mock('../../main/windows', () => ({}))
jest.mock('../../main/windows/nav', () => ({}))
jest.mock('../../main/signers', () => ({}))
jest.mock('../../main/externalData')
jest.mock('../../main/updater')
jest.mock('../../main/launch', () => ({}))

//jest.mock('electron')

let connection

beforeAll(async () => {
  log.transports.console.level = false
  jest.useRealTimers()

  console.log({ ipc })

  
  await import('../../main')
  const provider = (await import('../../main/provider')).default
  ipc.emit('tray:ready')

  return new Promise((resolve) => {
    if (provider.connected) {
      console.log('provider already connected!')
      return resolve()
    }

    provider.on('connect', () => {
      console.log('provider connected!')
      resolve()
    })
  })
  
})

beforeEach((done) => {
  console.log('STARTING BEFORE EACH')

  connection = ethProvider('http://127.0.0.1:1248', { origin: 'test.frame.eth' })

  connection.on('connect', () => {
    console.log('eth provider connected!')
    done()
  })
})

it('accepts a request', async () => {
  console.log('we tested!')
})