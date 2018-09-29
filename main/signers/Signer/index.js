const EventEmitter = require('events')
const windows = require('../../windows')

class Signer extends EventEmitter {
  constructor () {
    super()
    this.accounts = []
  }
  getCoinbase (cb) {
    cb(null, this.accounts[0])
  }
  getAccounts (cb) {
    cb(null, this.accounts)
  }
  summary () {
    return {
      id: this.id,
      type: this.type,
      index: this.index,
      accounts: this.accounts,
      status: this.status,
      network: this.network
    }
  }
  open () {
    windows.broadcast('main:action', 'addSigner', this.summary())
  }
  close () {
    windows.broadcast('main:action', 'removeSigner', this.summary())
  }
  update () {
    windows.broadcast('main:action', 'updateSigner', this.summary())
  }
  signTransaction (rawTx, cb) {
    console.warn('Signer:' + this.type + ' did not implement a signTransaction method.')
  }
}

module.exports = Signer
