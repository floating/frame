import Ledger, { Status } from '../../../../../main/signers/ledger/Ledger'
import Eth from '../../../../../main/signers/ledger/Ledger/eth'
import { Derivation } from '../../../../../main/signers/Signer/derive'

jest.mock('../../../../../main/signers/ledger/Ledger/eth')
jest.mock('@ledgerhq/hw-transport-node-hid')

function runRequests () {
  // move forward in time to allow the queue to process requests
  jest.advanceTimersByTime(200)
}

const addresses = [
  '0xf10326c1c6884b094e03d616cc8c7b920e3f73e0',
  '0xa16002db5438b5862270a9e404346e3c3b059eeb'
]

let ledger

beforeEach(async () => {
  jest.useFakeTimers()
  Eth.mockClear()
  
  ledger = new Ledger('usb-path')
  ledger.derivation = Derivation.legacy

  await ledger.open()
  
  Eth.mock.instances[0].getAppConfiguration.mockResolvedValue({ version: '1.9.2' })
  Eth.mock.instances[0].deriveAddresses.mockImplementation(() => Promise.resolve(addresses))
})

afterEach(async () => {
  await ledger.close()
})

afterAll(() => {
  jest.useRealTimers()
})

describe('#connect', () => {
  it('sets the status to connecting while checking if the eth app is available', done => {
    ledger.once('update', () => {
      try {
        expect(ledger.status).toBe(Status.INITIAL)
        done()
      } catch (e) { done(e) }
    })

    ledger.connect()
  })

  describe('when the eth app is open', () => {
    it('sets the version', async () => {
      await ledger.connect()
  
      expect(ledger.appVersion).toEqual({
        major: 1, minor: 9, patch: 2
      })
    })

    it('detects that the app is locked', done => {
      const stateFlow = []
      
      Eth.mock.instances[0].getAddress.mockRejectedValue({ statusCode: 27404 })

      ledger.on('update', () => {
        stateFlow.push(ledger.status)

        try {
          expect(stateFlow).toEqual([Status.INITIAL])
          expect(ledger.status).toBe(Status.INITIAL)
        } catch (e) { done(e) }
      })

      ledger.once('lock', () => {
        try {
          expect(ledger.status).toBe(Status.LOCKED)
          expect(ledger.eth).toBeDefined()
          done()
        } catch (e) { done(e) }
      })

      ledger.connect()
    })

    it('derives addresses after connecting', done => {
      const stateFlow = []

      ledger.on('update', () => {
        stateFlow.push(ledger.status)

        if (ledger.status === Status.OK) {
          try {
            expect(ledger.addresses).toEqual(addresses)
            expect(stateFlow).toEqual([Status.INITIAL, Status.DERIVING, Status.OK])
            done()
          } catch (e) { done(e) }
        }
      })

      ledger.connect().then(runRequests)
    })
  })

  describe('when the eth app is not open', () => {
    // these status codes all represent a different app or the Ledger main menu being open
    const statusCodes = [27904, 27906, 25873, 25871]

    statusCodes.forEach(code => {
      it(`sets the status to wrong application and closes the signer when the status code is ${code}`, done => {
        Eth.mock.instances[0].getAppConfiguration.mockRejectedValue({ statusCode: code })
  
        const stateFlow = []
  
        ledger.on('update', () => {
          stateFlow.push(ledger.status)
        })
  
        ledger.on('close', () => {
          try {
            expect(ledger.eth).not.toBeDefined()
            expect(ledger.status).toBe(Status.WRONG_APP)
            expect(stateFlow).toEqual([Status.INITIAL, Status.WRONG_APP])
            done()
          } catch (e) { done(e) }
        })
  
        ledger.connect()
      })
    })
  })
})

describe('#deriveAddress', () => {
  beforeEach(done => {
    ledger.on('update', () => {
      if (ledger.status === Status.OK) done()
    })

    ledger.connect().then(runRequests)
  })

  it('derives hardware addresses', done => {
    const stateFlow = []
  
    ledger.on('update', () => {
      stateFlow.push(ledger.status)

      if (ledger.status === Status.DERIVING) {
        try {
          expect(ledger.addresses).toHaveLength(0)
        } catch (e) { done(e) }
      }

      if (ledger.status === Status.OK) {
        try {
          expect(stateFlow).toEqual([Status.DERIVING, Status.OK])
          expect(ledger.addresses).toEqual(addresses)
          done()
        } catch (e) { done(e) }
      }
    })

    ledger.derivation = Derivation.legacy
    ledger.deriveAddresses()
    runRequests()
  })

  it('derives live addresses', done => {
    Eth.mock.instances[0].getAddress.mockImplementation(path => {
      if (path === "44'/60'/0'/0/0") return Promise.resolve({ address: addresses[0] })
      if (path === "44'/60'/1'/0/0") return Promise.resolve({ address: addresses[1] })

      return Promise.reject('unknown path!')
    })

    const stateFlow = []

    const firstUpdateDone = new Promise(resolve => {
      ledger.on('update', () => {
        stateFlow.push(ledger.status)
  
        if (ledger.status === Status.DERIVING) {
          try {
            expect(ledger.addresses).toHaveLength(0)
          } catch (e) { done(e) }
        }
  
        if (ledger.status === Status.OK) {
          if (ledger.addresses.length === 2) {
            try {
              expect(stateFlow).toEqual([Status.DERIVING, Status.OK, Status.OK])
              expect(ledger.addresses).toEqual(addresses)
              done()
            } catch (e) { done(e) }
          } else {
            // resolve this promise to run the next request
            resolve()
          }
        }
      })
  
      ledger.accountLimit = 2
      ledger.derivation = Derivation.live
      ledger.deriveAddresses()
      
      runRequests()
    })

    // all this craziness is necessary to simulate the queue running multiple
    // requests, resolving their promsies, and advancing the timer to run the next request
    firstUpdateDone.then(() => { }).then(runRequests)
  })
})
