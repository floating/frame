const EthereumTx = require('ethereumjs-tx')
const Signer = require('../../Signer')

class Hot extends Signer {
  constructor (id) {
    super()
    this.id = id
    this.type = 'Hot'
    this.accounts = [id === 1 ? '0x0559fB375De2281b3C32020d26cc976c53527484' : '0x030E6aF4985f111c265ee3A279e5a9f6AA124Fd5']
    this.privateKey = id === 1 ? '2d6945dbddb8dcf5492004e6f720f8e971196ff61a61c4be99714ebc71e06c00' : 'aef6a68a47c1628081e4e6df195f5f712ae4eb7da332a6d74dca06ae32a3e7ae'
    this.status = 'ok'
    this.open()
  }
  signTransaction (rawTx, cb) {
    const tx = new EthereumTx(rawTx)
    tx.sign(Buffer.from(this.privateKey, 'hex'))
    setTimeout(() => cb(null, '0x' + tx.serialize().toString('hex')), 1200) // Response delay for development
  }
}

module.exports = Hot
