const EthTx = require('ethereumjs-tx')
const { hashPersonalMessage, toBuffer, ecsign, addHexPrefix } = require('ethereumjs-util')
const log = require('electron-log')
const Signer = require('../../Signer')

class Seed extends Signer {
  constructor (signer, signers) {
    super()
    log.info('Creating seed signer instance')
    this.id = signer.id
    this.type = signer.type
    this.addresses = signer.addresses
    this.seed = signer.seed
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

module.exports = Seed
