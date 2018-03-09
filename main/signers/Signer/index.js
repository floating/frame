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
      accounts: this.accounts,
      status: this.status
    }
  }
  open () {
    windows.broadcast('main:addSigner', this.summary())
  }
  close () {
    windows.broadcast('main:removeSigner', this.summary())
  }
  update () {
    windows.broadcast('main:updateSigner', this.summary())
  }
  signTransaction (rawTx, cb) {
    console.warn('Signer:' + this.type + ' did not implement a signTransaction method.')
  }
}

module.exports = Signer
