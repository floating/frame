const path = require('path')
const { fork } = require('child_process')
const log = require('electron-log')
const { fromPrivateKey, fromV1, fromV3 } = require('ethereumjs-wallet')
const crypt = require('../../../crypt')

const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class RingSigner extends HotSigner {
  constructor (signer) {
    super(signer)
    this.encryptedKeys = signer.encryptedKeys || []
    this.worker = fork(WORKER_PATH)
    this.update()
  }

  save () { super.save({ encryptedKeys: this.encryptedKeys }) }

  unlock (password, cb) { super.unlock(password, { encryptedKeys: this.encryptedKeys }, cb) }

  addPrivateKey (key, password, cb) {
    // Get address
    const wallet = fromPrivateKey(Buffer.from(key, 'hex'))
    const address = '0x' + wallet.getAddress().toString('hex')

    // Ensure private key hasn't already been added
    if (this.addresses.includes(address)) {
      return cb(new Error('Private key already added'))
    }

    // Encrypt private key
    crypt.encrypt(key, password, (err, encryptedKey) => {
      if (err) return cb(err)

      // Update addresses and encryptedKeys
      this.addresses = [...this.addresses, address]
      this.encryptedKeys = [...this.encryptedKeys, encryptedKey]

      // Update worker key store
      this.unlock(password, (err, result) => {
        if (err) return cb(err)
        this.update()
        log.info('Private key added to signer', this.id)
        cb(null)
      })
    })
  }

  removePrivateKey (index, cb) {
    // Remove address at index
    this.addresses = this.addresses.filter((address) => address !== this.addresses[index])

    // Remove encrypted key at index
    this.encryptedKeys = this.encryptedKeys.filter((key) => key !== this.encryptedKeys[index])

    // Remove key in worker process
    this._callWorker({ method: 'removeKey', params: { index } }, (err, result) => {
      if (err) return cb(err)
      this.update()
      log.info('Private key removed from signer', this.id)
      cb(null)
    })
  }

  // TODO: Encrypt all keys together so that they all get the same password
  addFromKeystore (keystore, keystorePassword, signerPassword, cb) {
    let wallet

    // Try to generate wallet from keystore
    try {
      if (keystore.version === 1) wallet = fromV1(keystore, keystorePassword)
      else if (keystore.version === 3) wallet = fromV3(keystore, keystorePassword)
      else cb(new Error('Invalid keystore version'))
    } catch (e) { return cb(e) }

    // Add private key
    this.addPrivateKey(wallet._privKey, signerPassword, cb)
  }



    // this.verifyAddress(0, this.addresses[0], console.log)

    // const pk = crypto.randomBytes(32).toString('hex')
    // this.addPrivateKey(pk, 'frame', console.log)

    // setTimeout(() => {
    //   this.removePrivateKey(1, console.log)
    // }, 1000);
}

module.exports = RingSigner
