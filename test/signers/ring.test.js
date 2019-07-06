const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const hot = require('../../main/signers/hot')
const { clean } = require('../util')
const store = require('../../main/store')

const PASSWORD = 'frame'
const FILE_PATH = path.resolve(__dirname, 'keystore.json')

// Stubs
const signers = {
  add: (signer) => {}
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
      expect(store(`main.signers.${signer.id}.id`)).toBe(signer.id)
      done()
    })
  })

  test('Scan for signers', (done) => {
    let count = 0
    const signers = { add: (signer) => { signer.close(() => {}); count++ } }
    hot.scan(signers)
    expect(count).toBe(1)
    done()
  })

  test('Close signer', (done) => {
    signer.close()
    expect(store(`main.signers.${signer.id}`)).toBe(undefined)
    done()
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
    signer.removePrivateKey(0, PASSWORD, (err, result) => {
      expect(err).toBe(null)
      expect(signer.addresses.length).toBe(1)
      expect(signer.addresses[0]).toEqual(secondAddress)
      done()
    })
  })

  test('Remove last private key', (done) => {
    signer.removePrivateKey(0, PASSWORD, (err, result) => {
      expect(err).toBe(null)
      done()
    })
  })

  test('Add private key from keystore', (done) => {
    const file = fs.readFileSync(FILE_PATH, 'utf8')
    const keystore = JSON.parse(file)
    const previousLength = signer.addresses.length
    signer.addKeystore(keystore, 'test', PASSWORD, (err, result) => {
      expect(err).toBe(null)
      expect(signer.addresses.length).toBe(previousLength + 1)
      done()
    })
  })

  test('Unlock with wrong password', (done) => {
    signer.unlock('Wrong password', (err, result) => {
      expect(err).not.toBe(null)
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
      value: '0x0'
    }

    signer.signTransaction(0, rawTx, (err, result) => {
      expect(err).toBe(null)
      expect(result.length).not.toBe(0)
      expect(result.slice(0, 2)).toBe('0x')
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

  test('Verify wrong address', (done) => {
    signer.verifyAddress(0, '0xabcdef', (err, result) => {
      expect(err).toBe(null)
      expect(result).toBe(false)
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

  test('Close signer', (done) => {
    signer.close()
    done()
  })
})
