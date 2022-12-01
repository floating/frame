import Ledger, { Status } from '../../../../../main/signers/ledger/Ledger'
import Eth from '../../../../../main/signers/ledger/Ledger/eth'
import { Derivation } from '../../../../../main/signers/Signer/derive'
import log from 'electron-log'
import { SignTypedDataVersion } from '@metamask/eth-sig-util'

jest.mock('../../../../../main/signers/ledger/Ledger/eth')
jest.mock('@ledgerhq/hw-transport-node-hid-noevents')

function runNextRequest() {
  // move forward in time to allow the queue to process one request
  jest.advanceTimersByTime(200)
}

async function connectEthApp() {
  Eth.mock.instances[0].getAppConfiguration.mockResolvedValue({ version: '2.0.1' })

  return new Promise((resolve) => {
    ledger.on('update', () => {
      if (ledger.status === Status.OK) resolve()
    })

    // connect and run initial request to derive addresses
    ledger.connect().then(runNextRequest)
  })
}

function verifyDone(done, expectations) {
  verify(done, expectations, true)
}

function verify(done, expectations, complete = false) {
  try {
    expectations()
    if (complete) done()
  } catch (e) {
    done(e)
  }
}

function verifyPromise(resolve, reject, expectations) {
  try {
    expectations()
    resolve()
  } catch (e) {
    reject(e)
  }
}

const addresses = ['0xf10326c1c6884b094e03d616cc8c7b920e3f73e0', '0xa16002db5438b5862270a9e404346e3c3b059eeb']

let ledger

beforeAll(() => {
  jest.useFakeTimers()
  log.transports.console.level = false
})

beforeEach(async () => {
  Eth.mockClear()

  ledger = new Ledger('usb-path')
  ledger.derivation = Derivation.legacy

  await ledger.open()

  Eth.mock.instances[0].deriveAddresses.mockImplementation(() => Promise.resolve(addresses))
})

afterEach(async () => {
  ledger.removeAllListeners()
  await ledger.disconnect()
})

afterAll(() => {
  jest.useRealTimers()
  log.transports.console.level = 'debug'
})

describe('#connect', () => {
  describe('when the eth app is open', () => {
    beforeEach(() => {
      Eth.mock.instances[0].getAppConfiguration.mockResolvedValue({ version: '1.9.2' })
    })

    it('sets the version', async () => {
      await ledger.connect()

      expect(ledger.appVersion).toEqual({
        major: 1,
        minor: 9,
        patch: 2,
      })
    })

    it('detects that the app is locked', (done) => {
      const stateFlow = []

      Eth.mock.instances[0].getAddress.mockRejectedValue({ statusCode: 27404 })

      ledger.on('update', () => {
        stateFlow.push(ledger.status)

        verify(done, () => {
          expect(stateFlow).toEqual([Status.INITIAL])
          expect(ledger.status).toBe(Status.INITIAL)
        })
      })

      ledger.once('lock', () => {
        verifyDone(done, () => {
          expect(ledger.status).toBe(Status.LOCKED)
          expect(ledger.eth).toBeDefined()
        })
      })

      ledger.connect()
    })

    it('derives addresses after connecting', (done) => {
      const stateFlow = []

      ledger.on('update', () => {
        stateFlow.push(ledger.status)

        if (ledger.status === Status.OK) {
          verifyDone(done, () => {
            expect(ledger.addresses).toEqual(addresses)
            expect(stateFlow).toEqual([Status.INITIAL, Status.DERIVING, Status.OK])
          })
        }
      })

      ledger.connect().then(runNextRequest)
    })
  })

  describe('when the eth app is not open', () => {
    // these status codes all represent a different app or the Ledger main menu being open
    const statusCodes = [27904, 27906, 25873, 25871]

    statusCodes.forEach((code) => {
      it(`sets the status to wrong application and disconnects the signer when the status code is ${code}`, async () => {
        Eth.mock.instances[0].getAppConfiguration.mockRejectedValue({ statusCode: code })

        ledger.on('update', () => {
          expect(ledger.status).toEqual(Status.WRONG_APP)
        })

        await ledger.connect()

        expect(ledger.eth).not.toBeDefined()
      })
    })
  })
})

describe('#deriveAddress', () => {
  beforeEach(async () => {
    await connectEthApp()
  })

  it('derives hardware addresses', (done) => {
    const stateFlow = []

    ledger.on('update', () => {
      stateFlow.push(ledger.status)

      if (ledger.status === Status.DERIVING) {
        verify(done, () => expect(ledger.addresses).toHaveLength(0))
      }

      if (ledger.status === Status.OK) {
        verifyDone(done, () => {
          expect(stateFlow).toEqual([Status.DERIVING, Status.OK])
          expect(ledger.addresses).toEqual(addresses)
        })
      }
    })

    ledger.derivation = Derivation.legacy
    ledger.deriveAddresses()
    runNextRequest()
  })

  it('derives live addresses', (done) => {
    Eth.mock.instances[0].getAddress.mockImplementation((path) => {
      if (path === "44'/60'/0'/0/0") return Promise.resolve({ address: addresses[0] })
      if (path === "44'/60'/1'/0/0") return Promise.resolve({ address: addresses[1] })

      return Promise.reject('unknown path!')
    })

    const stateFlow = []

    const firstUpdateDone = new Promise((resolve) => {
      ledger.on('update', () => {
        stateFlow.push(ledger.status)

        if (ledger.status === Status.DERIVING) {
          verify(done, () => expect(ledger.addresses).toHaveLength(0))
        }

        if (ledger.status === Status.OK) {
          if (ledger.addresses.length === 2) {
            verifyDone(done, () => {
              expect(stateFlow).toEqual([Status.DERIVING, Status.OK, Status.OK])
              expect(ledger.addresses).toEqual(addresses)
            })
          } else {
            // resolve this promise to run the next request
            resolve()
          }
        }
      })

      ledger.accountLimit = 2
      ledger.derivation = Derivation.live
      ledger.deriveAddresses()

      runNextRequest()
    })

    // all this craziness is necessary to simulate the queue running multiple
    // requests, resolving their promsies, and advancing the timer to run the next request
    firstUpdateDone
      .then(() => {})
      .then(() => {})
      .then(runNextRequest)
  })
})

describe('#verifyAddress', () => {
  beforeEach(async () => {
    await connectEthApp()

    Eth.mock.instances[0].getAddress.mockImplementation(
      (path) =>
        new Promise((resolve) => {
          resolve({
            address:
              path === "44'/60'/0'/9"
                ? '0xe9d6f5779cf6936de03c0bec631f3bb3e336d98d'
                : '0xCd37a15BdfEc87D0e383E628da2399053D5948ca',
          })
        })
    )
  })

  it('verifies an address', (done) => {
    ledger.once('update', () => done('status updated unexpectedly!'))

    ledger.verifyAddress(9, '0xe9d6f5779cf6936de03c0bec631f3bb3e336d98d', false, (err, verified) => {
      verifyDone(done, () => {
        expect(verified).toBe(true)
        expect(err).toBeFalsy()
      })
    })

    runNextRequest()
  })

  const errorCases = [
    {
      testCase: 'the address does not match',
      expectedError: 'Address does not match device',
    },
    {
      testCase: 'the verification request is rejected by the user',
      expectedError: 'Verify request rejected by user',
      setup: () => Eth.mock.instances[0].getAddress.mockRejectedValue({ statusCode: 27013 }),
    },
    {
      testCase: 'there is a communication error',
      setup: () => Eth.mock.instances[0].getAddress.mockRejectedValue({ statusCode: -1 }),
    },
    {
      testCase: 'the eth app is not initialized',
      setup: () => (ledger.eth = undefined),
    },
    {
      testCase: 'the derivation type is not initialized',
      setup: () => (ledger.derivation = undefined),
    },
  ]

  errorCases.forEach(({ testCase, setup = () => {}, expectedError = 'Verify address error' }) => {
    it(`fails if ${testCase}`, async () => {
      const statusUpdate = new Promise((resolve, reject) => {
        ledger.on('update', () => {
          verifyPromise(resolve, reject, () => expect(ledger.status).toBe(Status.NEEDS_RECONNECTION))
        })
      })

      const callback = new Promise((resolve, reject) => {
        setup()

        ledger.verifyAddress(1, '0xe9d6f5779cf6936de03c0bec631f3bb3e336d98d', false, (err, verified) => {
          verifyPromise(resolve, reject, () => {
            expect(verified).toBeUndefined()
            expect(err.message).toBe(expectedError)
          })
        })
      })

      runNextRequest()

      return Promise.all([statusUpdate, callback])
    })
  })
})

const signingMethods = ['signMessage', 'signTransaction']

signingMethods.forEach((signingMethod) => {
  const signType = signingMethod.substring(4).toLowerCase()

  describe(`#${signingMethod}`, () => {
    beforeEach(async () => {
      await connectEthApp()
    })

    it(`signs a ${signType}`, (done) => {
      Eth.mock.instances[0][signingMethod].mockImplementation(
        (path) =>
          new Promise((resolve) => {
            resolve(
              path === "44'/60'/0'/3"
                ? '0x724e7dfa6ee0fd0dd84c5d8a84eb57be29ff20ed253b3249de2e3d6b119d7b1e6a211ce0c48f93c5e399ac8cd7c6fe56e36fa960b6da92de2c435814928f2f8c1b'
                : '0xf257b7f96ad7cbf11b80c2085dc76d10ede662fb2c77dc7fbd9f574d78d9da6d08cb1a99c7d97ac87b9d7f5a4e3ae052ba3a11888fdfeefe6a169a0547c1b2e01b'
            )
          })
      )

      ledger.once('update', () => done('Ledger unexpectedly updated!'))

      ledger[signingMethod](3, 'hello, Frame!', (err, signature) => {
        verifyDone(done, () => {
          expect(ledger.status).toBe(Status.OK)
          expect(err).toBeFalsy()
          expect(signature).toBe(
            '0x724e7dfa6ee0fd0dd84c5d8a84eb57be29ff20ed253b3249de2e3d6b119d7b1e6a211ce0c48f93c5e399ac8cd7c6fe56e36fa960b6da92de2c435814928f2f8c1b'
          )
        })
      })

      runNextRequest()
    })

    it('fails if the signing request is rejected by the user', (done) => {
      Eth.mock.instances[0][signingMethod].mockRejectedValue({ statusCode: 27013 })

      ledger.once('update', () => done('Ledger unexpectedly updated!'))
      ledger.once('close', () => done('Ledger unexpectedly closed!'))

      ledger[signingMethod](3, 'hello, Frame!', (err, signature) => {
        verifyDone(done, () => {
          expect(ledger.status).toBe(Status.OK)
          expect(signature).toBeUndefined()
          expect(err.message).toBe('Sign request rejected by user')
        })
      })

      runNextRequest()
    })

    const errorCases = [
      {
        testCase: 'there is a communication error',
        setup: () => Eth.mock.instances[0][signingMethod].mockRejectedValue({ statusCode: -1 }),
      },
      {
        testCase: 'the eth app is not initialized',
        setup: () => (ledger.eth = undefined),
      },
      {
        testCase: 'the derivation type is not initialized',
        setup: () => (ledger.derivation = undefined),
      },
    ]

    errorCases.forEach(({ testCase, setup = () => {} }) => {
      it(`fails if ${testCase}`, async () => {
        const statusUpdate = new Promise((resolve, reject) => {
          ledger.on('update', () => {
            verifyPromise(resolve, reject, () => expect(ledger.status).toBe(Status.NEEDS_RECONNECTION))
          })
        })

        const callback = new Promise((resolve, reject) => {
          setup()

          ledger[signingMethod](3, 'hello, Frame!', (err, signature) => {
            verifyPromise(resolve, reject, () => {
              expect(signature).toBeUndefined()
              expect(err.message).toBe(`Sign ${signType} error`)
            })
          })
        })

        runNextRequest()

        return Promise.all([statusUpdate, callback])
      })
    })
  })
})

describe('#signTypedData', () => {
  beforeEach(async () => {
    await connectEthApp()
  })

  it('signs v4 typed data', (done) => {
    Eth.mock.instances[0].signTypedData.mockImplementation(
      (path) =>
        new Promise((resolve) => {
          resolve(
            path === "44'/60'/0'/5"
              ? '0x724e7dfa6ee0fd0dd84c5d8a84eb57be29ff20ed253b3249de2e3d6b119d7b1e6a211ce0c48f93c5e399ac8cd7c6fe56e36fa960b6da92de2c435814928f2f8c1b'
              : '0xf257b7f96ad7cbf11b80c2085dc76d10ede662fb2c77dc7fbd9f574d78d9da6d08cb1a99c7d97ac87b9d7f5a4e3ae052ba3a11888fdfeefe6a169a0547c1b2e01b'
          )
        })
    )

    ledger.once('update', () => done('Ledger unexpectedly updated!'))

    ledger.signTypedData(5, { version: SignTypedDataVersion.V4, data: 'typed data' }, (err, signature) => {
      verifyDone(done, () => {
        expect(ledger.status).toBe(Status.OK)
        expect(err).toBeFalsy()
        expect(signature).toBe(
          '0x724e7dfa6ee0fd0dd84c5d8a84eb57be29ff20ed253b3249de2e3d6b119d7b1e6a211ce0c48f93c5e399ac8cd7c6fe56e36fa960b6da92de2c435814928f2f8c1b'
        )
      })
    })

    runNextRequest()
  })

  it('fails if the signing request is rejected by the user', (done) => {
    Eth.mock.instances[0].signTypedData.mockRejectedValue({ statusCode: 27013 })

    ledger.once('update', () => done('Ledger unexpectedly updated!'))
    ledger.once('close', () => done('Ledger unexpectedly closed!'))

    ledger.signTypedData(5, { version: SignTypedDataVersion.V4, data: 'typed data' }, (err, signature) => {
      verifyDone(done, () => {
        expect(ledger.status).toBe(Status.OK)
        expect(signature).toBeUndefined()
        expect(err.message).toBe('Sign request rejected by user')
      })
    })

    runNextRequest()
  })

  it('fails if the signing request is invalid', (done) => {
    Eth.mock.instances[0].signTypedData.mockRejectedValue({
      statusCode: 99901,
      message: 'Invalid typed data',
    })

    ledger.once('update', () => done('Ledger unexpectedly updated!'))
    ledger.once('close', () => done('Ledger unexpectedly closed!'))

    ledger.signTypedData(5, { version: SignTypedDataVersion.V4, data: 'typed data' }, (err, signature) => {
      verifyDone(done, () => {
        expect(ledger.status).toBe(Status.OK)
        expect(signature).toBeUndefined()
        expect(err.message).toMatch(/Sign message error/)
      })
    })

    runNextRequest()
  })

  const errorCases = [
    {
      testCase: 'there is a communication error',
      setup: () => Eth.mock.instances[0].signTypedData.mockRejectedValue({ statusCode: -1 }),
    },
    {
      testCase: 'the eth app is not initialized',
      setup: () => (ledger.eth = undefined),
    },
    {
      testCase: 'the derivation type is not initialized',
      setup: () => (ledger.derivation = undefined),
    },
  ]

  errorCases.forEach(({ testCase, setup = () => {} }) => {
    it(`fails if ${testCase}`, async () => {
      const statusUpdate = new Promise((resolve, reject) => {
        ledger.on('update', () => {
          verifyPromise(resolve, reject, () => expect(ledger.status).toBe(Status.NEEDS_RECONNECTION))
        })
      })

      const callback = new Promise((resolve, reject) => {
        setup()

        ledger.signTypedData(
          5,
          { version: SignTypedDataVersion.V4, data: 'typed data' },
          (err, signature) => {
            verifyPromise(resolve, reject, () => {
              expect(signature).toBeUndefined()
              expect(err.message).toMatch(/Sign message error/)
            })
          }
        )
      })

      runNextRequest()

      return Promise.all([statusUpdate, callback])
    })
  })
})
