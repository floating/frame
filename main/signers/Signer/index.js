const windows = require('../../windows')

class Signer {
  constructor () {
    this.accounts = []
    this.index = 0
    this.requests = {}
  }
  getCoinbase (cb) {
    cb(null, this.accounts[0])
  }
  getAccounts (cb) {
    let account = this.accounts[this.index]
    if (cb) cb(null, account ? [account] : [])
    return account ? [account] : []
  }
  getSelectedAccounts () {
    return this.accounts[this.index] ? [this.accounts[this.index]] : []
  }
  summary () {
    return {
      id: this.id,
      type: this.type,
      index: this.index,
      accounts: this.accounts,
      status: this.status,
      network: this.network,
      requests: this.requests
    }
  }
  setIndex (i, cb) {
    this.index = i
    this.requests = {} // TODO Decline these requests before clobbering them
    windows.broadcast('main:action', 'updateSigner', this.summary())
    cb(null, this.summary())
  }
  open () {
    windows.broadcast('main:action', 'addSigner', this.summary())
  }
  close () {
    windows.broadcast('main:action', 'removeSigner', this.summary())
  }
  update (options = {}) {
    if (options.setView) windows.broadcast('main:action', 'setView', options.setView)
    windows.broadcast('main:action', 'updateSigner', this.summary())
  }
  signTransaction (rawTx, cb) {
    console.warn('Signer:' + this.type + ' did not implement a signTransaction method.')
  }
}

module.exports = Signer
