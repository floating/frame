const EthereumTx = require('ethereumjs-tx')
const Signer = require('../../Signer')

class Hot extends Signer {
  constructor (id) {
    super()
    this.id = id
    this.type = 'Hot'
    this.accounts = ['0x0559fb375de2281b3c32020d26cc976c53527484']
    this.status = 'ok'
    this.open()
  }
  signTransaction (rawTx, cb) {
    const tx = new EthereumTx(rawTx)
    tx.sign(Buffer.from('2d6945dbddb8dcf5492004e6f720f8e971196ff61a61c4be99714ebc71e06c00', 'hex'))
    setTimeout(() => cb(null, '0x' + tx.serialize().toString('hex')), 1200) // Response delay for development
  }
}

module.exports = Hot
