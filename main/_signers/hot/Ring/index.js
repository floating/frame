const EthTx = require('ethereumjs-tx')
const { hashPersonalMessage, toBuffer, ecsign, addHexPrefix } = require('ethereumjs-util') // privateToAddress
const Signer = require('../../Signer')

class Ring extends Signer {
  constructor (signer) {
    super()
    console.log('Create ring signer instance')
    console.log(signer)
    this.id = signer.id
    this.type = signer.type
    this.accounts = signer.accounts
  }
  // Standard Methods
  signMessage (message, cb) {
    const hash = hashPersonalMessage(toBuffer(message))
    const signed = ecsign(hash, this.privateKey)
    const hex = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]).toString('hex')
    cb(null, addHexPrefix(hex))
  }
  signTransaction (rawTx, cb) {
    const tx = new EthTx(rawTx)
    tx.sign(this.privateKey)
    setTimeout(() => cb(null, '0x' + tx.serialize().toString('hex')), 1000) // Response delay for development
  }
}

module.exports = Ring
