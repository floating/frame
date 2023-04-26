import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { _setDataPath } from 'electron'
import { remove } from 'fs-extra'
import { _forkedChildProcess as workerProcess } from 'child_process'

import store from '../../../../../main/store'
import hot from '../../../../../main/signers/hot'
import WorkerController from '../../../../../main/signers/hot/HotSigner/worker/controller'
import RingSignerWorker from '../../../../../main/signers/hot/RingSigner/worker'
import { assertDone } from '../../../../util'

jest.mock('../../../../../main/store', () => ({ updateSigner: jest.fn(), removeSigner: jest.fn() }))
jest.mock('child_process')

const PASSWORD = 'fr@///3_password'
const SIGNER_PATH = path.resolve(__dirname, '../.userData')
const FILE_PATH = path.resolve(__dirname, 'keystore.json')

const signers = { add: jest.fn() }

const worker = new RingSignerWorker()

const ipc = {
  send: (msg) => workerProcess.send(msg),
  on: (msg, cb) => workerProcess.on(msg, cb)
}

// simulate worker process being spawned
const startWorkerProcess = () => jest.runOnlyPendingTimers()

const launchWorkerProcess = () => {
  setTimeout(() => {
    new WorkerController(worker, ipc)
  }, 0)
}

const clean = async () => remove(SIGNER_PATH)

beforeAll(async () => {
  _setDataPath('userData', SIGNER_PATH)

  await clean()
})

beforeEach(() => {
  // this event is emitted when fork() is called in the mock child process library.
  // this will simulate the worker process being started asynchonously, on the
  // next tick of the event loop
  workerProcess.once('start', launchWorkerProcess)

  signers.add = jest.fn()
  store.updateSigner = jest.fn()
})

afterEach(() => {
  workerProcess.removeAllListeners()
})

afterAll(async () => {
  workerProcess.off('start', launchWorkerProcess)

  await clean()
})

describe('invalid keys', () => {
  it('should not create a signer from an invalid private key', (done) => {
    const privateKey = 'invalid key'

    hot.createFromPrivateKey(signers, privateKey, PASSWORD, (err) => {
      assertDone(() => {
        expect(err.message).toBe('Invalid private key')
        expect(signers.add).not.toHaveBeenCalled()
        expect(store.updateSigner).not.toHaveBeenCalled()
      }, done)
    })

    startWorkerProcess()
  })

  it('should not create a signer from an invalid keystore', (done) => {
    const keystore = { invalid: 'keystore' }

    hot.createFromKeystore(signers, keystore, 'test', PASSWORD, (err) => {
      assertDone(() => {
        expect(err.message).toBe('Invalid keystore version')
        expect(signers.add).not.toHaveBeenCalled()
        expect(store.updateSigner).not.toHaveBeenCalled()
      }, done)
    })

    startWorkerProcess()
  })
})

describe('Ring signer', () => {
  it('creates a signer from a private key', (done) => {
    const privateKey = '0x372f581b45880333b318a19d5bfd1e4ab680bdafbfbece0216876b7a94ef16ae'
    const expectedSigner = {
      name: 'hot signer',
      type: 'ring',
      model: 'keyring',
      id: '3661326338643332343336613133363039376137346262663331373663666430',
      addresses: ['0x249254933970e4ec336ea717fb9dc32d85dfa621'],
      appVersion: { major: 0, minor: 0, patch: 0 }
    }

    hot.createFromPrivateKey(signers, privateKey, PASSWORD, (err, signer) => {
      assertDone(() => {
        expect(err).toBe(null)
        expect(signer.status).toBe('ok')
        expect(signer.id).not.toBe(undefined)
        expect(store.updateSigner).toHaveBeenNthCalledWith(1, { ...expectedSigner, status: 'locked' })
        expect(store.updateSigner).toHaveBeenNthCalledWith(2, { ...expectedSigner, status: 'ok' })

        signer.close()
      }, done)
    })

    startWorkerProcess()
  }, 500)
})

describe.skip('yet to be converted', () => {
  test('Scan for signers', (done) => {
    let count = 0
    const signers = {
      add: (signer) => {
        try {
          signer.close(() => {})
          if (signer.type === 'ring') count++
          expect(count).toBe(1)
          done()
        } catch (e) {
          done(e)
        }
      },
      exists: () => false
    }

    hot.scan(signers)

    jest.runAllTimers()
  }, 800)

  test('Close signer', (done) => {
    try {
      signer.close()
      expect(store(`main.signers.${signer.id}`)).toBe(undefined)
      done()
    } catch (e) {
      done(e)
    }
  })

  test('Create from keystore', (done) => {
    try {
      const file = fs.readFileSync(FILE_PATH, 'utf8')
      const keystore = JSON.parse(file)
      hot.createFromKeystore(signers, keystore, 'test', PASSWORD, (err, result) => {
        signer = result
        expect(err).toBe(null)
        expect(signer.status).toBe('ok')
        expect(signer.id).not.toBe(undefined)
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 2000)

  test('Add private key', (done) => {
    try {
      const privateKey = crypto.randomBytes(32).toString('hex')
      signer.addPrivateKey(privateKey, PASSWORD, (err) => {
        expect(err).toBe(null)
        expect(signer.addresses.length).toBe(2)
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 2000)

  test('Remove private key', (done) => {
    try {
      const secondAddress = signer.addresses[1]
      signer.removePrivateKey(0, PASSWORD, (err) => {
        expect(err).toBe(null)
        expect(signer.addresses.length).toBe(1)
        expect(signer.addresses[0]).toEqual(secondAddress)
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 2000)

  test('Remove last private key', (done) => {
    try {
      signer.removePrivateKey(0, PASSWORD, (err) => {
        expect(err).toBe(null)
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 2000)

  test('Add private key from keystore', (done) => {
    try {
      const file = fs.readFileSync(FILE_PATH, 'utf8')
      const keystore = JSON.parse(file)
      const previousLength = signer.addresses.length

      signer.addKeystore(keystore, 'test', PASSWORD, (err) => {
        expect(err).toBe(null)
        expect(signer.addresses.length).toBe(previousLength + 1)
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 2000)

  test('Lock', (done) => {
    try {
      signer.lock((err) => {
        expect(err).toBe(null)
        expect(signer.status).toBe('locked')
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 2000)

  test('Unlock with wrong password', (done) => {
    try {
      signer.unlock('Wrong password', (err) => {
        expect(err).toBeTruthy()
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 600)

  test('Unlock', (done) => {
    try {
      signer.unlock(PASSWORD, (err) => {
        expect(err).toBe(null)
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 500)

  test('Sign message', (done) => {
    try {
      const message = '0x' + Buffer.from('test').toString('hex')

      signer.signMessage(0, message, (err, result) => {
        expect(err).toBe(null)
        expect(result.length).toBe(132)
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 500)

  test('Sign transaction', (done) => {
    const rawTx = {
      nonce: '0x6',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x30000',
      to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
      value: '0x0',
      chainId: '0x1'
    }

    try {
      signer.signTransaction(0, rawTx, (err, result) => {
        expect(err).toBe(null)
        expect(result.length).not.toBe(0)
        expect(result.slice(0, 2)).toBe('0x')
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 500)

  test('Verify address', (done) => {
    try {
      signer.verifyAddress(0, signer.addresses[0], false, (err, result) => {
        expect(err).toBe(null)
        expect(result).toBe(true)
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 500)

  test('Verify wrong address', (done) => {
    try {
      signer.verifyAddress(0, '0xabcdef', false, (err, result) => {
        expect(err.message).toBe('Unable to verify address')
        expect(result).toBe(undefined)
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 500)

  test('Sign message when locked', (done) => {
    try {
      signer.signMessage(0, 'test', (err) => {
        expect(err.message).toBe('Signer locked')
        done()
      })
    } catch (e) {
      done(e)
    }
  })

  test('Close signer', (done) => {
    try {
      signer.close()
      done()
    } catch (e) {
      done(e)
    }
  })
})
