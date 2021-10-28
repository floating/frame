/* globals test, expect, beforeAll, afterAll, describe */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { remove } from 'fs-extra'

import log from 'electron-log'

const PASSWORD = 'fr@///3_password'
const SIGNER_PATH = path.resolve(__dirname, '../.userData/signers')
const FILE_PATH = path.resolve(__dirname, 'keystore.json')

const mockPersist = {
  get: jest.fn(),
  set: jest.fn(),
  queue: jest.fn()
}

jest.mock('electron')
jest.mock('../../../../../compiled/store/persist', () => mockPersist)
jest.mock('../../../../../main/store/persist', () => mockPersist)

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

    hot = await import('../../../../../compiled/signers/hot')
    store = require('../../../../../compiled/store')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  afterAll(() => {
    clean()

    log.transports.console.level = 'debug'
  })

  test('Create from invalid private key', done => {
    const privateKey = 'invalid key'
    hot.createFromPrivateKey(signers, privateKey, PASSWORD, err => {
      try {
        expect(err).toBeTruthy()
        expect(store('main.signers')).toEqual({})
        done()
      } catch (e) { done(e) }
    })
  })

  test('Create from invalid keystore key', done => {
    const keystore = { invalid: 'keystore' }
    hot.createFromKeystore(signers, keystore, 'test', PASSWORD, err => {
      try {
        expect(err).toBeTruthy()
        expect(store('main.signers')).toEqual({})
        done()
      } catch (e) { done(e) }
    })
  })

  test('Create from private key', done => {
    const privateKey = '0x' + crypto.randomBytes(32).toString('hex')
    hot.createFromPrivateKey(signers, privateKey, PASSWORD, (err, result) => {
      signer = result

      try {
        expect(err).toBe(null)
        expect(signer.status).toBe('locked')
        expect(signer.id).not.toBe(undefined)
        expect(store(`main.signers.${signer.id}.id`)).toBe(signer.id)
        done()
      } catch(e) { done(e) }
    })
  })

  test('Scan for signers', done => {
    jest.useFakeTimers()

    let count = 0
    const signers = {
      add: (signer) => {
        try {
          signer.close(() => {})
          if (signer.type === 'ring') count++
          expect(count).toBe(1)
          done()
        } catch (e) { done(e) }
      },
      exists: () => false
    }

    hot.scan(signers)

    jest.runAllTimers()
  }, 1000)

  test('Close signer', done => {
    try {
      signer.close()
      expect(store(`main.signers.${signer.id}`)).toBe(undefined)
      done()
    } catch (e) { done(e) }
  })

  test('Create from keystore', done => {
    const file = fs.readFileSync(FILE_PATH, 'utf8')
    const keystore = JSON.parse(file)
    hot.createFromKeystore(signers, keystore, 'test', PASSWORD, (err, result) => {
      try {
        signer = result
        expect(err).toBe(null)
        expect(signer.status).toBe('locked')
        expect(signer.id).not.toBe(undefined)
        done()
      } catch (e) { done(e) }
    })
  })

  test('Add private key', done => {
    const privateKey = crypto.randomBytes(32).toString('hex')
    signer.addPrivateKey(privateKey, PASSWORD, err => {
      try {
        expect(err).toBe(null)
        expect(signer.addresses.length).toBe(2)
        done()
      } catch (e) { done(e) }
    })
  })

  test('Remove private key', done => {
    const secondAddress = signer.addresses[1]
    signer.removePrivateKey(0, PASSWORD, err => {
      try {
        expect(err).toBe(null)
        expect(signer.addresses.length).toBe(1)
        expect(signer.addresses[0]).toEqual(secondAddress)
        done()
      } catch (e) { done(e) }
    })
  })

  test('Remove last private key', done => {
    signer.removePrivateKey(0, PASSWORD, err => {
      try {
        expect(err).toBe(null)
        done()
      } catch (e) { done(e) }
    })
  })

  test('Add private key from keystore', done => {
    const file = fs.readFileSync(FILE_PATH, 'utf8')
    const keystore = JSON.parse(file)
    const previousLength = signer.addresses.length
    signer.addKeystore(keystore, 'test', PASSWORD, err => {
      try {
        expect(err).toBe(null)
        expect(signer.addresses.length).toBe(previousLength + 1)
        done()
      } catch (e) { done(e) }
    })
  })

  test('Unlock with wrong password', done => {
    signer.unlock('Wrong password', err => {
      try {
        expect(err).toBeTruthy()
        done()
      } catch (e) { done (e) }
    })
  })

  test('Unlock', done => {
    signer.unlock(PASSWORD, err => {
      try {
        expect(err).toBe(null)
        done()
      } catch (e) { done(e) }
    })
  })

  test('Sign message', done => {
    const message = '0x' + Buffer.from('test').toString('hex')

    signer.signMessage(0, message, (err, result) => {
      try {
        expect(err).toBe(null)
        expect(result.length).toBe(132)
        done()
      } catch (e) { done(e) }
    })
  })

  test('Sign transaction', done => {
    const rawTx = {
      nonce: '0x6',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x30000',
      to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
      value: '0x0',
      chainId: '0x1'
    }

    signer.signTransaction(0, rawTx, (err, result) => {
      try {
        expect(err).toBe(null)
        expect(result.length).not.toBe(0)
        expect(result.slice(0, 2)).toBe('0x')
        done()
      } catch (e) { done(e) }
    })
  })

  test('Verify address', done => {
    signer.verifyAddress(0, signer.addresses[0], false, (err, result) => {
      try {
        expect(err).toBe(null)
        expect(result).toBe(true)
        done()
      } catch (e) { done(e) }
    })
  })

  test('Verify wrong address', done => {
    signer.verifyAddress(0, '0xabcdef', false, (err, result) => {
      try {
        expect(err.message).toBe('Unable to verify address')
        expect(result).toBe(undefined)
        done()
      } catch (e) { done(e) }
    })
  })

  test('Lock', done => {
    signer.lock(err => {
      try {
        expect(err).toBe(null)
        expect(signer.status).toBe('locked')
        done()
      } catch (e) { done(e) }
    })
  })

  test('Sign message when locked', done => {
    signer.signMessage(0, 'test', err => {
      try {
        expect(err.message).toBe('Signer locked')
        done()
      } catch (e) { done(e) }
    })
  })

  test('Close signer', done => {
    try {
      signer.close()
      done()
    } catch (e) { done(e) }
  })
})
