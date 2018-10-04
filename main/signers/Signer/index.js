const windows = require('../../windows')

class Signer {
  constructor () {
    this.accounts = []
    this.index = 0
  }
  getCoinbase (cb) {
    cb(null, this.accounts[0])
  }
  getAccounts (cb) {
    let account = this.accounts[this.index]
    cb(null, account ? [account] : [])
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
  setIndex (i, cb) {
    this.index = i
    windows.broadcast('main:action', 'updateSigner', this.summary())
    cb(null, this.summary())
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
