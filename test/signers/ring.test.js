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


})