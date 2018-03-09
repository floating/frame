const EthereumTx = require('ethereumjs-tx')
const Signer = require('../../Signer')

class Ledger extends Signer {
  constructor (id, device, debug) {
    super()
    this.debug = debug
    this.id = id
    this.device = device
    this.type = 'Nano S'
    this.status = 'loading'
    this.handlers = {}
    this.deviceStatus()
    this.open()
  }
  deviceStatus () {
    this.device.getAddress(`44'/60'/0'/0'/0`).then(result => {
      this.accounts = [result.address]
      this.status = 'ok'
      this.update()
    }).catch(err => {
      this.status = err.message
      if (err.statusCode === 26368) this.status = 'Select the Ethereum Application on Your Ledger'
      if (err.statusCode === 26625) this.status = 'Device Is Asleep'
      this.update()
    })
  }
  normalize (hex) {
    if (hex == null) return ''
    if (hex.startsWith('0x')) hex = hex.substring(2)
    if (hex.length % 2 !== 0) hex = '0' + hex
    return hex
  }
  // Standard Methods
  signTransaction (rawTx, cb) {
    const tx = new EthereumTx(rawTx)
    tx.raw[6] = Buffer.from([rawTx.chainId]) // v
    tx.raw[7] = Buffer.from([]) // r
    tx.raw[8] = Buffer.from([]) // s
    const rawTxHex = tx.serialize().toString('hex')
    this.device.signTransaction(`44'/60'/0'/0'/0`, rawTxHex).then(result => {
      let tx = new EthereumTx({
        nonce: Buffer.from(this.normalize(rawTx.nonce), 'hex'),
        gasPrice: Buffer.from(this.normalize(rawTx.gasPrice), 'hex'),
        gasLimit: Buffer.from(this.normalize(rawTx.gas), 'hex'),
        to: Buffer.from(this.normalize(rawTx.to), 'hex'),
        value: Buffer.from(this.normalize(rawTx.value), 'hex'),
        data: Buffer.from(this.normalize(rawTx.data), 'hex'),
        v: Buffer.from(this.normalize(result.v), 'hex'),
        r: Buffer.from(this.normalize(result.r), 'hex'),
        s: Buffer.from(this.normalize(result.s), 'hex')
      })
      cb(null, '0x' + tx.serialize().toString('hex'))
    }).catch(err => {
      cb(err)
    })
  }
}

module.exports = Ledger
