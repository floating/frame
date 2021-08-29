let chains, provider
import { EventEmitter } from 'events'

// mock disk access modules
// jest.mock('../../main/store/persist', () => ({
//   get: jest.fn(),
//   set: jest.fn(),
//   queue: jest.fn()
// }))

// mock electron rendering modules
class MockElectronApp extends EventEmitter {
  constructor () {
    super()
  }

  getPath (key) {
    if (key === 'userData') {
      return '/Users/matthewholtzman/projects/frame/test/.userData'
    }
  }

  getVersion () {
    return '0.0.test'
  }

  getName () {
    return 'Frame test app'
  }
}

let mockElectronApp

jest.mock('../../main/windows', () => ({ broadcast: jest.fn(), showTray: jest.fn() }))

jest.mock('electron', () => {
  return {
    ipcMain: {
      on: jest.fn(),
    },
    app: mockElectronApp
  }
})

// mock external processes
// TODO uncomment these as we figure out how to clean them up correctly
jest.mock('../../main/externalData')
jest.mock('../../main/nebula')

beforeAll(async () => {
  chains = (await import('../../main/chains')).default
  provider = (await import('../../main/provider')).default
})

beforeEach(() => {
  // mockElectronApp = new MockElectronApp()
})

afterEach(() => {
  // mockElectronApp.emit('quit')
})

it('gets the chain id', function (done) {
  chains.on('connect:ethereum:31337', () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_chainId'
    }

    provider.send(request, response => {
      expect(parseInt(response.result)).toBe(31337)
      done()
    })
  })
})