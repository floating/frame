/* globals test, expect, beforeAll, afterAll, describe */
import path from 'path'
import { remove } from 'fs-extra'
import { generateMnemonic } from 'bip39'

import log from 'electron-log'

const PASSWORD = 'fr@///3_password'
const SIGNER_PATH = path.resolve(__dirname, '../.userData/signers')

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

describe('Seed signer', () => {
  let signer

  beforeAll(async () => {
    log.transports.console.level = false

    clean()

    hot = await import('../../../../../compiled/signers/hot')
    store = require('../../../../../compiled/store').default
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  afterAll(() => {
    clean()

    log.transports.console.level = 'debug'
  })

  test('Create from invalid phrase', (done) => {
    const mnemonic = 'invalid mnemonic'
    hot.createFromPhrase(signers, mnemonic, PASSWORD, err => {
      expect(err).toBeTruthy()
      expect(store('main.signers')).toEqual({})
      done()
    })
  }, 200)

  test('Create from phrase', (done) => {
    const mnemonic = generateMnemonic()
    hot.createFromPhrase(signers, mnemonic, PASSWORD, (err, result) => {
      signer = result
      expect(err).toBe(null)
      expect(signer.status).toBe('locked')
      expect(signer.addresses.length).toBe(100)
      expect(store(`main.signers.${signer.id}.id`)).toBe(signer.id)
      done()
    })
  }, 1000)

  test('Scan for signers', (done) => {
    jest.useFakeTimers()

    let count = 0
    const signers = {
      add: (signer) => {
        signer.close(() => {})
        if (signer.type === 'seed') count++
        expect(count).toBe(1)
        done()
      },
      exists: () => false
    }

    hot.scan(signers)

    jest.runAllTimers()
  })

  test('Unlock with wrong password', (done) => {
    signer.unlock('Wrong password', err => {
      expect(err).toBeTruthy()
      expect(signer.status).toBe('locked')
      done()
    })
  }, 200)

  test('Unlock', (done) => {
    signer.unlock(PASSWORD, err => {
      expect(err).toBe(null)
      done()
    })
  }, 200)

  test('Sign message', (done) => {
    const message = '0x' + Buffer.from('test').toString('hex')

    signer.signMessage(0, message, (err, result) => {
      expect(err).toBe(null)
      expect(result.length).toBe(132)
      done()
    })
  })

  test('Sign transaction', (done) => {
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

  test('Verify address', (done) => {
    signer.verifyAddress(0, signer.addresses[0], false, (err, result) => {
      expect(err).toBe(null)
      expect(result).toBe(true)
      done()
    })
  })

  test('Verify wrong address', (done) => {
    signer.verifyAddress(0, '0xabcdef', false, (err, result) => {
      expect(err.message).toBe('Unable to verify address')
      expect(result).toBe(undefined)
      done()
    })
  })

  test('Lock', (done) => {
    signer.lock(err => {
      expect(err).toBe(null)
      expect(signer.status).toBe('locked')
      done()
    })
  })

  test('Sign message when locked', (done) => {
    signer.signMessage(0, 'test', err => {
      expect(err.message).toBe('Signer locked')
      done()
    })
  })

  test('Close signer', (done) => {
    signer.close()
    expect(store(`main.signers.${signer.id}`)).toBe(undefined)
    done()
  })
})
