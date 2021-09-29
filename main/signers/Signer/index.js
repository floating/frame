// const HDKey = require('hdkey')
// const { publicToAddress, toChecksumAddress } = require('ethereumjs-util')

// const deriveHDAccounts = require('worker-farm')(require.resolve('./derive'))
const log = require('electron-log')
const deriveHDAccounts = require('./derive')
const EventEmitter = require('events')
const crypt = require('../../crypt')

class Signer extends EventEmitter {
  constructor () {
    super()

    this.addresses = []
  }

  deriveHDAccounts (publicKey, chainCode, cb) {
    deriveHDAccounts(publicKey, chainCode, cb)
  }

  fingerprint () {
    if (this.addresses && this.addresses.length) return crypt.stringToKey(this.addresses.join()).toString('hex')
  }

  getCoinbase (cb) {
    cb(null, this.addresses[0])
  }

  verifyAddress (cb) {
    const err = new Error('Signer:' + this.type + ' did not implement verifyAddress method')
    log.error(err)
    cb(err)
  }

  getAccounts (cb) {
    const account = this.addresses[this.index]
    if (cb) cb(null, account ? [account] : [])
    return account ? [account] : []
  }

  getSelectedAccounts () {
    return this.addresses[this.index] ? [this.addresses[this.index]] : []
  }

  getSelectedAccount () {
    return this.addresses[this.index]
  }

  summary () {
    return {
      id: this.id,
      name: this.name || this.type + ' signer',
      type: this.type,
      addresses: this.addresses,
      status: this.status,
      liveAddressesFound: this.liveAddressesFound || 0,
      appVersion: this.appVersion || { major: 0, minor: 0, patch: 0 }
    }
  }

  open () {
    // windows.broadcast('main:action', 'addSigner', this.summary())
  }

  close () {
    // windows.broadcast('main:action', 'removeSigner', this.summary())
  }

  delete () {
    
  }

  update (options = {}) {
    // if (options.setView) windows.broadcast('main:action', 'setView', options.setView)
    // windows.broadcast('main:action', 'updateSigner', this.summary())
  }

  signMessage (index, message, cb) {
    console.warn('Signer:' + this.type + ' did not implement a signMessage method')
  }

  signTransaction (index, rawTx, cb) {
    console.warn('Signer:' + this.type + ' did not implement a signTransaction method')
  }

  signTypedData (index, typedData, cb) {
    return cb(new Error(`Signer: ${this.type} does not support eth_signTypedData`))
  }
}

module.exports = Signer
