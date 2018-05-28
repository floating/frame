const Web3 = require('web3')
const EthereumTx = require('ethereumjs-tx')
const Signer = require('../../Signer')

let normalize = key => key == null ? '' : key.startsWith('0x') ? key : '0x' + key

class Hot extends Signer {
  constructor (key) {
    super()
    this.web3 = new Web3()
    this.account = this.web3.eth.accounts.privateKeyToAccount(normalize(key))
    this.id = key
    this.type = 'Hot'
    this.accounts = [this.account.address]
    this.privateKey = key.startsWith('0x') ? key.substring(2) : key
    this.status = 'ok'
    this.open()
  }
  signTransaction (rawTx, cb) {
    const tx = new EthereumTx(rawTx)
    tx.sign(Buffer.from(this.privateKey, 'hex'))
    setTimeout(() => cb(null, '0x' + tx.serialize().toString('hex')), 200) // Response delay for development
  }
}

module.exports = Hot
