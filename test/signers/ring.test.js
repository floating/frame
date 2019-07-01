const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const hot = require('../../main/signers/hot')
const { clean } = require('../util')
const PASSWORD = 'frame'
const FILE_PATH = path.resolve(__dirname, 'keystore.json')

// Stubs
const signers = {
  add: (signer) => console.log('Signer added')
}

describe('Ring signer', () => {
  let signer

  beforeAll(clean)
  afterAll(clean)

  test('Create from private key', (done) => {
    const privateKey = crypto.randomBytes(32).toString('hex')
    hot.createFromPrivateKey(signers, privateKey, PASSWORD, (err, result) => {
      signer = result
      expect(err).toBe(null)
      expect(signer.status).toBe('locked')
      expect(signer.id).not.toBe(undefined)
      done()
    })
  })

  test('Create from keystore', (done) => {
    const file = fs.readFileSync(FILE_PATH, 'utf8')
    const keystore = JSON.parse(file)
    hot.createFromKeystore(signers, keystore, 'test', PASSWORD, (err, result) => {
      signer = result
      expect(err).toBe(null)
      expect(signer.status).toBe('locked')
      expect(signer.id).not.toBe(undefined)
      done()
    })
  })

  test('Add private key', (done) => {
    const privateKey = crypto.randomBytes(32).toString('hex')
    signer.addPrivateKey(privateKey, PASSWORD, (err, result) => {
      expect(err).toBe(null)
      expect(signer.addresses.length).toBe(2)
      done()
    })
  })

  test('Remove private key', (done) => {
    const secondAddress = signer.addresses[1]
    signer.removePrivateKey(0, (err, result) => {
      expect(err).toBe(null)
      expect(signer.addresses.length).toBe(1)
      expect(signer.addresses[0]).toEqual(secondAddress)
      done()
    })
  })

  test('Unlock', (done) => {
    signer.unlock(PASSWORD, (err, result) => {
      expect(err).toBe(null)
      done()
    })
  })

  test('Sign message', (done) => {
    signer.signMessage(0, 'test', (err, result) => {
      expect(err).toBe(null)
      expect(result.length).toBe(132)
      done()
    })
  })

  test('Sign tranasction', (done) => {
    let rawTx = {
      nonce: '0x6',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x30000',
      to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
      value: '0x00'
    }

    signer.signTransaction(0, rawTx, (err, result) => {
      expect(err).toBe(null)
      expect(result.length).not.toBe(0)
      done()
    })
  })

  test('Verify address', (done) => {
    signer.verifyAddress(0, signer.addresses[0], (err, result) => {
      expect(err).toBe(null)
      expect(result).toBe(true)
      done()
    })
  })

  test('Lock', (done) => {
    signer.lock((err, result) => {
      expect(err).toBe(null)
      expect(signer.status).toBe('locked')
      done()
    })
  })

  test('Sign message when locked', (done) => {
    signer.signMessage(0, 'test', (err, result) => {
      expect(err.message).toBe('Signer locked')
      done()
    })
  })
})
