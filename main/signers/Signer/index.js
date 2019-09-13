const log = require('electron-log')
const deriveHDAccounts = require('./derive')
const EventEmitter = require('events')
const crypt = require('../../crypt')

class Signer extends EventEmitter {
  constructor () {
    super()
    this.addresses = []
    this.index = 0
    this.requests = {}
  }

  deriveHDAccounts (publicKey, chainCode, cb) {
    deriveHDAccounts(publicKey, chainCode, cb)
  }

  fingerprint () {
    if (this.network && this.addresses && this.addresses.length) return crypt.stringToKey(this.network + this.addresses.join()).toString('hex')
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
      type: this.type,
      addresses: this.addresses,
      status: this.status,
      network: this.network,
      liveAddressesFound: this.liveAddressesFound || 0
    }
  }

  setIndex (i, cb) {
    this.index = i
    this.requests = {} // TODO Decline these requests before clobbering them
    // windows.broadcast('main:action', 'updateSigner', this.summary())
    cb(null, this.summary())
  }

  open () {
    // windows.broadcast('main:action', 'addSigner', this.summary())
  }

  close () {
    // windows.broadcast('main:action', 'removeSigner', this.summary())
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
