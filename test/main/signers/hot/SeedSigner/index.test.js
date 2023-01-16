/* globals test, expect, beforeAll, afterAll, describe */
import path from 'path'
import { remove } from 'fs-extra'
import { generateMnemonic } from 'bip39'

import log from 'electron-log'

const PASSWORD = 'fr@///3_password'
const SIGNER_PATH = path.resolve(__dirname, '../.userData/signers')

jest.mock('electron')
jest.mock('../../../../../compiled/main/store/persist', () => ({
  get: jest.fn(),
  set: jest.fn(),
  queue: jest.fn()
}))
jest.mock('../../../../../main/store/persist')

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

    hot = await import('../../../../../compiled/main/signers/hot')
    store = require('../../../../../compiled/main/store').default
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  afterAll(() => {
    clean()
    if (signer.status !== 'locked') {
      signer.close()
    }
    log.transports.console.level = 'debug'
  })

  test('Create from invalid phrase', (done) => {
    const mnemonic = 'invalid mnemonic'

    try {
      hot.createFromPhrase(signers, mnemonic, PASSWORD, (err) => {
        expect(err).toBeTruthy()
        expect(store('main.signers')).toEqual({})
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 1000)

  test('Create from phrase', (done) => {
    try {
      const mnemonic = generateMnemonic()
      hot.createFromPhrase(signers, mnemonic, PASSWORD, (err, result) => {
        signer = result
        expect(err).toBe(null)
        expect(signer.status).toBe('ok')
        expect(signer.addresses.length).toBe(100)
        expect(store(`main.signers.${signer.id}.id`)).toBe(signer.id)
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 10_000)

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
  }, 800)

  test('Unlock with wrong password', (done) => {
    try {
      signer.unlock('Wrong password', (err) => {
        expect(err).toBeTruthy()
        expect(signer.status).toBe('locked')
        done()
      })
    } catch (e) {
      done(e)
    }
  }, 2000)

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
      expect(store(`main.signers.${signer.id}`)).toBe(undefined)
      done()
    } catch (e) {
      done(e)
    }
  })
})
