const log = require('electron-log')
const utils = require('web3-utils')
const bip32Path = require('bip32-path')
const EthereumTx = require('ethereumjs-tx')
const { toChecksumAddress } = require('ethereumjs-util')
const store = require('../../../store')
const Signer = require('../../Signer')

class Trezor extends Signer {
  constructor (device, debug) {
    super()
    this.debug = debug
    this.device = device
    this.id = device.originalDescriptor.path
    this.type = 'Trezor'
    this.status = 'loading'
    this.accounts = []
    this.index = 0
    this.basePath = () => this.network === '1' ? `m/44'/60'/0'/0/` : `m/44'/1'/0'/0/`
    this.getPath = (i = this.index) => this.basePath() + i
    this.handlers = {}
    device.on('button', code => this.button(code))
    device.on('passphrase', cb => this.passphrase(cb))
    device.on('pin', (type, cb) => this.needPin(cb))
    device.on('disconnect', () => this.close())
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
  button (label) {
    log.info(`Trezor button "${label}" was pressed`)
  }
  lookupAccounts (limit, cb) {
    const addresses = []
    const lookup = (i = 0) => {
      this.device.waitForSessionAndRun(session => {
        return session.ethereumGetAddress(bip32Path.fromString(this.getPath(i)).toPathArray())
      }).then(result => {
        addresses[i] = toChecksumAddress(result.message.address)
        if (addresses.length === limit) { cb(null, addresses) } else { lookup(++i) }
      }).catch(cb)
    }
    lookup()
  }
  deviceStatus (deep, limit = 15) {
    this.lookupAccounts(deep ? limit : 1, (err, accounts) => {
      if (err) {
        this.status = 'loading'
        this.accounts = []
        this.index = 0
        this.update()
      } else if (accounts.length) {
        if (accounts[0] !== this.coinbase || this.status !== 'ok') {
          this.coinbase = accounts[0]
          this.accounts = accounts
          if (this.index > accounts.length - 1) this.index = 0
          this.deviceStatus(true)
        }
        if (accounts.length > this.accounts.length) this.accounts = accounts
        this.status = 'ok'
        this.update()
      } else {
        this.status = 'Unable to find accounts'
        this.accounts = []
        this.index = 0
        this.update()
      }
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
    if (parseInt(this.network) !== utils.hexToNumber(rawTx.chainId)) return cb(new Error('Signer signTx network mismatch'))
    const trezorTx = [
      bip32Path.fromString(this.getPath()).toPathArray(),
      this.normalize(rawTx.nonce),
      this.normalize(rawTx.gasPrice),
      this.normalize(rawTx.gas),
      this.normalize(rawTx.to),
      this.normalize(rawTx.value),
      this.normalize(rawTx.data),
      utils.hexToNumber(rawTx.chainId)
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
