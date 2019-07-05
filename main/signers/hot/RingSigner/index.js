const path = require('path')
const log = require('electron-log')
const { fromPrivateKey, fromV1, fromV3 } = require('ethereumjs-wallet')

const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class RingSigner extends HotSigner {
  constructor (signer) {
    super(signer, WORKER_PATH)
    this.encryptedKeys = (signer && signer.encryptedKeys)
    this.type = 'ring'
    this.update()
  }

  save () {
    super.save({ encryptedKeys: this.encryptedKeys })
  }

  unlock (password, cb) {
    super.unlock(password, { encryptedKeys: this.encryptedKeys }, cb)
  }

  addPrivateKey (key, password, cb) {
    // Get address
    const wallet = fromPrivateKey(Buffer.from(key, 'hex'))
    const address = '0x' + wallet.getAddress().toString('hex')

    // Ensure private key hasn't already been added
    if (this.addresses.includes(address)) {
      return cb(new Error('Private key already added'))
    }

    // Call worker
    const params = { encryptedKeys: this.encryptedKeys, key, password }
    this._callWorker({ method: 'addKey', params }, (err, encryptedKeys) => {
      // Handle errors
      if (err) return cb(err)

      // Update addresses
      this.addresses = [...this.addresses, address]

      // Update encrypted keys
      this.encryptedKeys = encryptedKeys

      // Log and update signer
      log.info('Private key added to signer', this.id)
      this.update()

      // If signer was unlock -> update keys in worker
      if (this.status === 'ok') this.unlock(password, cb)
      else cb(null)
    })
  }

  removePrivateKey (index, password, cb) {
    // Call worker
    const params = { encryptedKeys: this.encryptedKeys, index, password }
    this._callWorker({ method: 'removeKey', params }, (err, encryptedKeys) => {
      // Handle errors
      if (err) return cb(err)

      // Remove address at index
      this.addresses = this.addresses.filter((address) => address !== this.addresses[index])

      // Update encrypted keys
      this.encryptedKeys = encryptedKeys

      // Log and update signer
      log.info('Private key removed from signer', this.id)
      this.update()

      // If signer was unlock -> update keys in worker
      if (this.status === 'ok') this.unlock(password, cb)
      else cb(null)
    })
  }

  // TODO: Encrypt all keys together so that they all get the same password
  addKeystore (keystore, keystorePassword, password, cb) {
    let wallet

    // Try to generate wallet from keystore
    try {
      if (keystore.version === 1) wallet = fromV1(keystore, keystorePassword)
      else if (keystore.version === 3) wallet = fromV3(keystore, keystorePassword)
      else cb(new Error('Invalid keystore version'))
    } catch (e) { return cb(e) }

    // Add private key
    this.addPrivateKey(wallet._privKey.toString('hex'), password, cb)
  }
}

module.exports = RingSigner
