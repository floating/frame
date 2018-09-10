const utils = require('web3-utils')
const EthereumTx = require('ethereumjs-tx')
const Signer = require('../../Signer')
const store = require('../../../store')

class Ledger extends Signer {
  constructor (id, device) {
    super()
    this.id = id
    this.device = device
    this.type = 'Ledger'
    this.status = 'loading'
    this.accounts = []
    this.network = ''
    this.getPath = () => this.network === '1' ? `m/44'/60'/0'/0` : `m/44'/1'/0'/0`
    this.handlers = {}
    this.open()
    store.observer(() => {
      if (this.network !== store('local.connection.network')) {
        this.network = store('local.connection.network')
        this.status = 'loading'
        this.accounts = []
        this.update()
        if (this.network) this.deviceStatus()
      }
    })
  }
  deviceStatus () {
    this.device.getAddress(this.getPath()).then(result => {
      this.accounts = [result.address]
      this.status = 'ok'
      this.update()
    }).catch(err => {
      this.status = err.message
      if (err.statusCode === 27904) this.status = 'Wrong application, select the Ethereum application on your Ledger'
      if (err.statusCode === 26368) this.status = 'Select the Ethereum application on your Ledger'
      if (err.statusCode === 26625 || err.statusCode === 26628) this.status = 'Confirm your Ledger is not asleep and is running firmware version 1.4.0 or newer'
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
  signPersonal (message, cb) {
    this.device.signPersonalMessage(this.getPath(), message.replace('0x', '')).then(result => {
      let v = (result['v'] - 27).toString(16)
      if (v.length < 2) v = '0' + v
      cb(null, result['r'] + result['s'] + v)
    }).catch(err => cb(err.message))
  }
  signTransaction (rawTx, cb) {
    if (parseInt(this.network) !== utils.hexToNumber(rawTx.chainId)) return cb(new Error('Signer signTx network mismatch'))
    const tx = new EthereumTx(rawTx)
    tx.raw[6] = Buffer.from([rawTx.chainId]) // v
    tx.raw[7] = Buffer.from([]) // r
    tx.raw[8] = Buffer.from([]) // s
    const rawTxHex = tx.serialize().toString('hex')
    this.device.signTransaction(this.getPath(), rawTxHex).then(result => {
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
    }).catch(err => cb(err.message))
  }
}

module.exports = Ledger
