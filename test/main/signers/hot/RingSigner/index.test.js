/* globals test, expect, beforeAll, afterAll, describe */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { remove } from 'fs-extra'

import log from 'electron-log'

const PASSWORD = 'fr@///3_password'
const SIGNER_PATH = path.resolve(__dirname, '../.userData/signers')
const FILE_PATH = path.resolve(__dirname, 'keystore.json')

jest.mock('electron')
jest.mock('../../../../../compiled/main/store/persist', () => ({
  get: jest.fn(),
  set: jest.fn(),
  queue: jest.fn(),
}))
jest.mock('../../../../../main/store/persist')

// Stubs
const signers = { add: () => {} }
// Util
const clean = () => remove(SIGNER_PATH)

let hot, store

describe('Ring signer', () => {
  let signer

  beforeAll(async () => {
    log.transports.console.level = false

    clean()

    hot = await import('../../../../../compiled/main/signers/hot')
    store = require('../../../../../compiled/main/store').default
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  afterAll(() => {
    clean()

    log.transports.console.level = 'debug'
  })

  test('Create from invalid private key', (done) => {
    const privateKey = 'invalid key'

    try {
      hot.createFromPrivateKey(signers, privateKey, PASSWORD, (err) => {
        expect(err).toBeTruthy()
        expect(store('main.signers')).toEqual({})
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 1000)

  test('Create from invalid keystore key', (done) => {
    const keystore = { invalid: 'keystore' }

    try {
      hot.createFromKeystore(signers, keystore, 'test', PASSWORD, (err) => {
        expect(err).toBeTruthy()
        expect(store('main.signers')).toEqual({})
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 2000)

  test('Create from private key', (done) => {
    try {
      const privateKey = '0x' + crypto.randomBytes(32).toString('hex')
      hot.createFromPrivateKey(signers, privateKey, PASSWORD, (err, result) => {
        signer = result

        expect(err).toBe(null)
        expect(signer.status).toBe('locked')
        expect(signer.id).not.toBe(undefined)
        expect(store(`main.signers.${signer.id}.id`)).toBe(signer.id)
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 2000)

  test('Scan for signers', (done) => {
    jest.useFakeTimers()

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
      exists: () => false,
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
        expect(signer.status).toBe('locked')
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
  }, 1000)

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

  test('Unlock with wrong password', (done) => {
    try {
      signer.unlock('Wrong password', (err) => {
        expect(err).toBeTruthy()
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 500)

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
      chainId: '0x1',
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
