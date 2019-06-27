const path = require('path')
const { fork } = require('child_process')
const log = require('electron-log')
const { fromPrivateKey } = require('ethereumjs-wallet')
const crypt = require('../../../crypt')
const crypto = require('crypto')

const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class RingSigner extends HotSigner {
  constructor (signer) {
    super(signer)
    this.encryptedKeys = signer.encryptedKeys || []
    this.worker = fork(WORKER_PATH)
    setTimeout(() => {
      this.unlock('frame', () => {})
      setTimeout(() => {
        this._debug()
      }, 1000)
    }, 1000)
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

  _debug () {
    console.log('\nDebugging Ring Signer')

    // // Sign message
    // this.signMessage(0, 'test', console.log)

    // // Sign txp
    // let rawTx = {
    //   nonce: '0x6',
    //   gasPrice: '0x09184e72a000',
    //   gasLimit: '0x30000',
    //   to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
    //   value: '0x00'
    // }
    // this.signTransaction(0, rawTx, console.log)

    // this.verifyAddress(0, this.addresses[0], console.log)

    // const pk = crypto.randomBytes(32).toString('hex')
    // this.addPrivateKey(pk, 'frame', console.log)

    // setTimeout(() => {
    //   this.removePrivateKey(1, console.log)
    // }, 1000);
  }
}

module.exports = RingSigner
