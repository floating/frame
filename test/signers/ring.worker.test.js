const worker = require('../../main/signers/hot/RingSigner/worker')

const PASSWORD = 'frame'
const KEYS = ['0x1111', '0x2222']

describe('Ring Signer worker', () => {
  let encryptedKeys

  test('Encrypt', async (done) => {
    encryptedKeys = await worker.encrypt(KEYS, PASSWORD)
    done()
  })

  test('Decrypt', async (done) => {
    const decryptedKeys = await worker.decrypt(encryptedKeys, PASSWORD)
    expect(decryptedKeys).toEqual(KEYS)
    done()
  })

  test('Add key', (done) => {
    const key = '0x3333'
    worker.addKey({ encryptedKeys, key, password: PASSWORD }, async (err, result) => {
      expect(err).toBe(null)
      let keys = await worker.decrypt(result, PASSWORD)
      expect(keys).toEqual([...KEYS, key])
      done()
    })
  })

  test('Remove key', (done) => {
    worker.removeKey({ encryptedKeys, index: 0, password: PASSWORD }, async (err, result) => {
      expect(err).toBe(null)
      let keys = await worker.decrypt(result, PASSWORD)
      expect(keys).toEqual([KEYS[1]])
      done()
    })
  })

  test('Unlock', (done) => {
    worker.unlock({ encryptedKeys, password: PASSWORD }, async (err, result) => {
      expect(err).toBe(null)
      done()
    })
  })

  test('Unlock with wrong password', (done) => {
    worker.unlock({ encryptedKeys, password: 'wrong password' }, async (err, result) => {
      expect(err).not.toBe(null)
      done()
    })
  })

})
