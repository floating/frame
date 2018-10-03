const EventEmitter = require('events')
const utils = require('web3-utils')

const windows = require('../../windows')
const provider = require('../../provider')

class Signer extends EventEmitter {
  constructor () {
    super()
    this.accounts = []
    this.index = 0
    this.balances = {}
    this.initial = true
  }
  refreshBalance (all) {
    let refresh = account => {
      provider.send({ 'jsonrpc': '2.0', 'method': 'eth_getBalance', 'params': [account, 'latest'], 'id': 1 }, res => {
        let balance = utils.fromWei(utils.hexToNumberString(res.result))
        if (this.balances[account] !== balance) {
          this.balances[account] = balance
          this.update()
        }
      })
    }
    if (all) {
      this.accounts.forEach(refresh)
    } else {
      refresh(this.accounts[this.index])
    }
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
      network: this.network,
      balances: this.balances
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
    if (this.accounts.length && this.initial) {
      this.refreshBalance()
      this.initial = false
    }
    windows.broadcast('main:action', 'updateSigner', this.summary())
  }
  signTransaction (rawTx, cb) {
    console.warn('Signer:' + this.type + ' did not implement a signTransaction method.')
  }
}

module.exports = Signer
