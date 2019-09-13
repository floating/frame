const path = require('path')
const log = require('electron-log')
const { Wallet } = require('ethers')
const { isValidPrivate } = require('ethereumjs-util')
const { toChecksumAddress } = require('web3-utils')

const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class RingSigner extends HotSigner {
  constructor (signer) {
    super(signer, WORKER_PATH)
    this.type = 'ring'
    this.encryptedKeys = (signer && signer.encryptedKeys)
    if (this.encryptedKeys) this.update()
  }

  save () {
    super.save({ encryptedKeys: this.encryptedKeys })
  }

  unlock (password, cb) {
    super.unlock(password, { encryptedKeys: this.encryptedKeys }, cb)
  }

  addPrivateKey (key, password, cb) {
    // Validate private key
    if (!isValidPrivate(this._keyToBuffer(key))) return cb(new Error('Invalid private key'))

    // Get address
    let wallet = new Wallet('0x' + key)
    let address = toChecksumAddress(wallet.address)

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

  async addKeystore (keystore, keystorePassword, password, cb) {
    try {
      // Extract private key from keystore
      const wallet = await Wallet.fromEncryptedJson(keystore, keystorePassword)
      const privateKey = wallet.privateKey.slice(2)

      // Add private key
      this.addPrivateKey(privateKey, password, cb)
    } catch (e) { return cb(e) }
  }

  _keyToBuffer (key) {
    return Buffer.from(key, 'hex')
  }
}

module.exports = RingSigner
