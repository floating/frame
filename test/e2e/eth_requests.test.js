let chains, provider
import log from 'electron-log'
import { EventEmitter } from 'events'


log.transports.console.level = false

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
  mockElectronApp = new MockElectronApp()

  chains = (await import('../../main/chains')).default
  provider = (await import('../../main/provider')).default

  return new Promise(resolve => {
    chains.once('connect:ethereum:31337', resolve)
  })
})

afterAll(() => {
  mockElectronApp.emit('quit')
})

it('gets the chain id', function (done) {
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

it('gets a transaction by hash', function (done) {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_getTransactionByHash',
    params: ['0x9b6887e5b533838640232e5645804e17c5f99604d3ab6a3cac2927d391670c3f']
  }
  
  provider.send(request, response => {
    const tx = response.result

    expect(tx).toEqual(
      expect.objectContaining({
        blockHash:'0x742e8218fd9f846d90a940bc1634aa9fb560ec34cfde3d43c6a4b26bc19a8a83',
        from: '0x4722aa9673167306cbb57ff579e26c664f27455b',
        to: '0x1a96673fd6ebeed815d07c7aba998f75fdd432b6',
        value: '0x0',
        v: '0x1',
        r: '0xd32785caadf19082180d98e1734b23a7280acb9a5f6393aaa626fe251c53b3b3',
        s: '0x6a2b900711f83ee555cfa91375efedd6b5e2fec26ef589ec39d1c40a2c761b52'
      })
    )
    
    done()
  })
})