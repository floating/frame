const bip39 = require('bip39')
const hot = require('../../main/signers/hot')

const PASSWORD = 'frame'

// Stubs
const signers = {
  add: (signer) => console.log('Signer added')
}
// TODO: Add hot.scan() to test
describe('Seed signer', () => {
  let signer

  test('Create from phrase', (done) => {
    const mnemonic = bip39.generateMnemonic()
    hot.createFromPhrase(signers, mnemonic, PASSWORD, (err, result) => {
      signer = result
      expect(err).toBe(null)
      expect(signer.id).not.toBe(undefined)
      expect(signer.status).toBe('locked')
      expect(signer.addresses.length).toBe(100)
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