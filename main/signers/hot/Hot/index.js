const EthTx = require('ethereumjs-tx')
const { hashPersonalMessage, toBuffer, ecsign, privateToAddress, addHexPrefix } = require('ethereumjs-util')
const Signer = require('../../Signer')

class Hot extends Signer {
  constructor (key) {
    super()
    this.privateKey = Buffer.from(key.replace('0x', ''), 'hex')
    this.id = key
    this.type = 'Hot'
    this.accounts = (new Array(20)).fill(addHexPrefix(privateToAddress(this.privateKey).toString('hex')))
    this.status = 'ok'
    this.open()
  }
  // Standard Methods
  signPersonal (message, cb) {
    const hash = hashPersonalMessage(toBuffer(message))
    const signed = ecsign(hash, this.privateKey)
    const hex = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]).toString('hex')
    cb(null, addHexPrefix(hex))
  }
  signTransaction (rawTx, cb) {
    const tx = new EthTx(rawTx)
    tx.sign(this.privateKey)
    setTimeout(() => cb(null, '0x' + tx.serialize().toString('hex')), 500) // Response delay for development
  }
}

module.exports = Hot
