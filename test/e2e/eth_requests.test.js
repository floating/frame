import log from 'electron-log'
import { utils } from 'ethers'
import { EventEmitter } from 'events'

log.transports.console.level = false

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

let chains, accounts, provider

beforeAll(async () => {
  mockElectronApp = new MockElectronApp()

  chains = (await import('../../main/chains')).default
  accounts = (await import('../../main/accounts')).default
  provider = (await import('../../main/provider')).default

  return new Promise(resolve => {
    chains.once('connect:ethereum:31337', resolve)
  })
})

afterAll(() => {
  jest.useRealTimers()

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


it('submits a transaction', function (done) {
  // jest.useFakeTimers()
  accounts.setSigner('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', async (err, summary) => {
    await sleep(2000)
    const tx = {
      value: utils.parseEther('.0002').toHexString(),
      from: summary.address,
      to: '0x22c22ebefc6a55b013e0edafbb0a8e5021190def',
      data: '0x'
    }
  
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendTransaction',
      params: [tx]
    }

    provider.send(request, response => {
      //console.log(accounts.current().requests)
      //provider.approveRequest(accounts.current().requests[0], jest.fn())
      const hash = response
  
      console.log({ hash })
      
      done()
    })

    let tries = 10

    while (tries > 0 && Object.keys(accounts.current().requests).length <= 0) {
      await sleep(1000)
      tries -= 1
    }

    provider.approveRequest(Object.values(accounts.current().requests)[0], (err, result) => {
      console.log({ err, result })
    })
  })

  
}, 10000)