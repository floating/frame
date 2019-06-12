// const HDKey = require('hdkey')
// const { publicToAddress, toChecksumAddress } = require('ethereumjs-util')

const deriveHDAccounts = require('worker-farm')(require.resolve('./derive'))

const crypt = require('../../crypt')

class Signer {
  constructor () {
    this.addresses = []
    this.index = 0
    this.requests = {}
  }
  deriveHDAccounts (publicKey, chainCode, cb) {
    deriveHDAccounts(publicKey, chainCode, cb)
  }
  addressesId () {
    if (this.addresses && this.addresses.length) return crypt.stringToKey(this.addresses.join()).toString('hex')
  }
  getCoinbase (cb) {
    cb(null, this.addresses[0])
  }
  getAccounts (cb) {
    let account = this.addresses[this.index]
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
      status: this.status
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
  signMessage (message, cb) {
    console.warn('Signer:' + this.type + ' did not implement a signMessage method.')
  }
  signTransaction (rawTx, cb) {
    console.warn('Signer:' + this.type + ' did not implement a signTransaction method.')
  }
}

module.exports = Signer
