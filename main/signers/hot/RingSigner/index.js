const path = require('path')
const { fork } = require('child_process')
const log = require('electron-log')
const { fromPrivateKey } = require('ethereumjs-wallet')
const crypt = require('../../../crypt')

const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class RingSigner extends HotSigner {
  constructor (signer) {
    super(signer)
    this.encryptedKeys = signer.encryptedKeys
    this.worker = fork(WORKER_PATH)
    setTimeout(() => {
      this.unlock('frame')
      setTimeout(() => {
        this._debug()
      }, 1000)
    }, 1000)
  }

  save () { super.save({ encryptedKeys: this.encryptedKeys }) }

  unlock (password) { super.unlock(password, { encryptedKeys: this.encryptedKeys }) }

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
      this.addresses = [...this.addresses, address]
      this.encryptedKeys.push(encryptedKey)
      this.save()
      this.update()
      log.info('Added private key to account', this.id)
    })
  }

  _debug () {
    console.log('\nDebugging Ring Signer')

    // Sign message
    this.signMessage(0, 'test', console.log)

    // Sign tx
    let rawTx = {
      nonce: '0x6',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x30000',
      to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
      value: '0x00'
    }
    this.signTransaction(0, rawTx, console.log)

    this.verifyAddress(0, this.addresses[0], console.log)

    const pk = '920f92dbe7ecb5d0a21a46bcda44c5bb566c0e807f8051cc2f0b4e601656f5b2'
    this.addPrivateKey(pk, 'frame', console.log)
  }
}

module.exports = RingSigner
