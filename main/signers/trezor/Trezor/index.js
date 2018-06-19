const Web3 = require('web3')
const bip32Path = require('bip32-path')
const EthereumTx = require('ethereumjs-tx')
const Signer = require('../../Signer')

class Trezor extends Signer {
  constructor (device, debug) {
    super()
    this.debug = debug
    this.device = device
    this.id = device.originalDescriptor.path
    this.type = 'Trezor'
    this.status = 'loading'
    this.index = 0
    this.path = `m/44'/60'/0'/0` + `/${this.index}`
    this.handlers = {}
    device.on('button', code => this.button(code))
    device.on('passphrase', cb => this.passphrase(cb))
    device.on('pin', (type, cb) => this.needPin(cb))
    device.on('disconnect', () => this.close())
    this.deviceStatus()
    this.open()
  }
  button (label) {
    console.log(`Trezor button "${label}" was pressed`)
  }
  deviceStatus () {
    this.device.waitForSessionAndRun(session => {
      return session.ethereumGetAddress(bip32Path.fromString(this.path).toPathArray())
    }).then(result => {
      this.accounts = ['0x' + result.message.address]
      this.status = 'ok'
      this.update()
    }).catch(err => {
      console.error('deviceStatus Error:', err)
    })
  }
  needPassphras (cb) {
    this.status = 'Need Passphrase'
    this.update()
    this.setPin = cb
  }
  needPin (cb) {
    this.status = 'Need Pin'
    this.update()
    this.setPin = cb
  }
  normalize (hex) {
    if (hex == null) return ''
    if (hex.startsWith('0x')) hex = hex.substring(2)
    if (hex.length % 2 !== 0) hex = '0' + hex
    return hex
  }
  // Standard Methods
  signTransaction (rawTx, cb) {
    const trezorTx = [
      bip32Path.fromString(this.path).toPathArray(),
      this.normalize(rawTx.nonce),
      this.normalize(rawTx.gasPrice),
      this.normalize(rawTx.gas),
      this.normalize(rawTx.to),
      this.normalize(rawTx.value),
      this.normalize(rawTx.data),
      Web3.utils.hexToNumber(rawTx.chainId)
    ]
    this.device.waitForSessionAndRun(session => session.signEthTx(...trezorTx)).then(result => {
      const tx = new EthereumTx({
        nonce: Buffer.from(this.normalize(rawTx.nonce), 'hex'),
        gasPrice: Buffer.from(this.normalize(rawTx.gasPrice), 'hex'),
        gasLimit: Buffer.from(this.normalize(rawTx.gas), 'hex'),
        to: Buffer.from(this.normalize(rawTx.to), 'hex'),
        value: Buffer.from(this.normalize(rawTx.value), 'hex'),
        data: Buffer.from(this.normalize(rawTx.data), 'hex'),
        v: result.v,
        r: Buffer.from(this.normalize(result.r), 'hex'),
        s: Buffer.from(this.normalize(result.s), 'hex')
      })
      cb(null, '0x' + tx.serialize().toString('hex'))
    }).catch(err => {
      cb(err)
    })
  }
}

module.exports = Trezor
