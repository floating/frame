const path = require('path')
const log = require('electron-log')
const { fromPrivateKey, fromV1, fromV3 } = require('ethereumjs-wallet').default

const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class RingSigner extends HotSigner {
  constructor(signer) {
    super(signer, WORKER_PATH)
    this.type = 'ring'
    this.model = 'keyring'
    this.encryptedKeys = signer && signer.encryptedKeys
    if (this.encryptedKeys) this.update()
  }

  save() {
    super.save({ encryptedKeys: this.encryptedKeys })
  }

  unlock(password, cb) {
    super.unlock(password, { encryptedKeys: this.encryptedKeys }, cb)
  }

  addPrivateKey(key, password, cb) {
    // Validate private key
    let wallet
    try {
      wallet = fromPrivateKey(Buffer.from(key, 'hex'))
    } catch (e) {
      return cb(new Error('Invalid private key'))
    }
    const address = wallet.getAddressString()

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
      if (this.status === 'locked') this.unlock(password, cb)
      else cb(null)
    })
  }

  removePrivateKey(index, password, cb) {
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
      if (this.status === 'ok') this.lock(cb)
      else cb(null)
    })
  }

  // TODO: Encrypt all keys together so that they all get the same password
  async addKeystore(keystore, keystorePassword, password, cb) {
    let wallet
    // Try to generate wallet from keystore
    try {
      if (keystore.version === 1) wallet = await fromV1(keystore, keystorePassword)
      else if (keystore.version === 3) wallet = await fromV3(keystore, keystorePassword)
      else return cb(new Error('Invalid keystore version'))
    } catch (e) {
      return cb(e)
    }
    // Add private key
    this.addPrivateKey(wallet.privateKey.toString('hex'), password, cb)
  }
}

module.exports = RingSigner
