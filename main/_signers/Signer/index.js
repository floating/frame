const HDKey = require('hdkey')
const { publicToAddress, toChecksumAddress } = require('ethereumjs-util')

class Signer {
  constructor () {
    this.accounts = []
    this.index = 0
    this.requests = {}
  }
  deriveHDAccounts (publicKey, chainCode) {
    let hdk = new HDKey()
    hdk.publicKey = Buffer.from(publicKey, 'hex')
    hdk.chainCode = Buffer.from(chainCode, 'hex')
    let derive = index => {
      let derivedKey = hdk.derive(`m/${index}`)
      let address = publicToAddress(derivedKey.publicKey, true)
      return toChecksumAddress(`0x${address.toString('hex')}`)
    }
    const accounts = []
    for (let i = 0; i < 15; i++) { accounts[i] = derive(i) }
    return accounts
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
  getSelectedAccount () {
    return this.accounts[this.index]
  }
  summary () {
    return {
      id: this.id,
      type: this.type,
      index: this.index,
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
