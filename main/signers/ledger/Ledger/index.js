const utils = require('web3-utils')
const EthereumTx = require('ethereumjs-tx')
const log = require('electron-log')
const HID = require('node-hid')
const Eth = require('@ledgerhq/hw-app-eth').default
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default
const Signer = require('../../Signer')
const store = require('../../../store')

class Ledger extends Signer {
  constructor (id, devicePath) {
    super()
    this.id = id
    this.devicePath = devicePath
    this.type = 'Ledger'
    this.status = 'initial'
    this.pause = false
    this.coinbase = '0x'
    this.accounts = []
    this.network = store('main.connection.network')
    this.index = 0
    this.basePath = () => this.network === '1' ? `44'/60'/0'/` : `44'/1'/0'/`
    this.getPath = (i = this.index) => this.basePath() + i
    this.handlers = {}
    this.deviceStatus()
    store.observer(() => {
      if (this.network !== store('main.connection.network')) {
        this.reset()
        this.deviceStatus()
      }
    })
  }
  update () {
    if (this.invalid || this.status === 'Invalid sequence' || this.status === 'initial') return
    super.update()
  }
  reset () {
    this.network = store('main.connection.network')
    this.status = 'loading'
    this.accounts = []
    this.index = 0
    this.update()
  }
  lookupAccounts (cb) {
    try {
      let transport = new TransportNodeHid(new HID.HID(this.devicePath))
      let eth = new Eth(transport)
      eth.getAddress(this.basePath(), false, true).then(result => {
        transport.close()
        cb(null, this.deriveHDAccounts(result.publicKey, result.chainCode))
      }).catch(err => {
        transport.close()
        cb(err)
      })
    } catch (err) {
      cb(err)
    }
  }
  close () {
    if (this._pollStatus) clearTimeout(this._pollStatus)
    if (this._deviceStatus) clearTimeout(this._deviceStatus)
    if (this._signPersonal) clearTimeout(this._signPersonal)
    if (this._signTransaction) clearTimeout(this._signTransaction)
    super.close()
  }
  pollStatus (interval = 21 * 1000) { // Detect sleep/wake
    clearTimeout(this._pollStatus)
    this._pollStatus = setTimeout(() => this.deviceStatus(), interval)
  }
  deviceStatus (deep, limit = 15) {
    if (this.status === 'Invalid sequence') return
    this.pollStatus()
    if (this.pause) return
    this.lookupAccounts((err, accounts) => {
      let last = this.status
      if (err) {
        if (err.message.startsWith('cannot open device with path')) { // Device is busy, try again
          clearTimeout(this._deviceStatus)
          this._deviceStatus = setTimeout(() => this.deviceStatus(deep), 700)
          log.info('>>>>>>> Busy: cannot open device with path, will try again')
        } else {
          this.status = err.message
          if (err.statusCode === 27904) this.status = 'Wrong application, select the Ethereum application on your Ledger'
          if (err.statusCode === 26368) this.status = 'Select the Ethereum application on your Ledger'
          if (err.statusCode === 26625 || err.statusCode === 26628) {
            this.pollStatus(3000)
            this.status = 'Confirm your Ledger is not asleep and is running firmware v1.4.0+'
          }
          if (err.message === 'Cannot write to HID device') {
            this.status = 'loading'
            log.error('Device Status: Cannot write to HID device')
          }
          if (err.message === 'Invalid channel') {
            this.status = 'Set browser support to "NO"'
            log.error('Device Status: Invalid channel -> Make sure browser support is set to OFF')
          }
          if (err.message === 'Invalid sequence') this.invalid = true
          this.accounts = []
          this.index = 0
          if (this.status !== last) this.update()
        }
      } else if (accounts && accounts.length) {
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
  normalize (hex) {
    if (hex == null) return ''
    if (hex.startsWith('0x')) hex = hex.substring(2)
    if (hex.length % 2 !== 0) hex = '0' + hex
    return hex
  }
  // Standard Methods
  signPersonal (message, cb) {
    this.pause = true
    try {
      let transport = new TransportNodeHid(new HID.HID(this.devicePath))
      let eth = new Eth(transport)
      eth.signPersonalMessage(this.getPath(), message.replace('0x', '')).then(result => {
        let v = (result['v'] - 27).toString(16)
        if (v.length < 2) v = '0' + v
        cb(null, result['r'] + result['s'] + v)
        transport.close()
        this.pause = false
      }).catch(err => {
        cb(err.message)
        transport.close()
        this.pause = false
      })
    } catch (err) {
      this.pause = false
      if (err.message.startsWith('cannot open device with path')) {
        this._signPersonal = setTimeout(() => this.signPersonal(message, cb), 700)
        return log.info('>>>>>>> Busy: cannot open device with path, will try again')
      }
      log.error(err)
    }
  }
  signTransaction (rawTx, cb) {
    this.pause = true
    try {
      let transport = new TransportNodeHid(new HID.HID(this.devicePath))
      let eth = new Eth(transport)
      if (parseInt(this.network) !== utils.hexToNumber(rawTx.chainId)) return cb(new Error('Signer signTx network mismatch'))
      const tx = new EthereumTx(rawTx)
      tx.raw[6] = Buffer.from([rawTx.chainId]) // v
      tx.raw[7] = Buffer.from([]) // r
      tx.raw[8] = Buffer.from([]) // s
      const rawTxHex = tx.serialize().toString('hex')
      eth.signTransaction(this.getPath(), rawTxHex).then(result => {
        transport.close()
        this.pause = false
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
        transport.close()
        this.pause = false
        cb(err.message)
      })
    } catch (err) {
      this.pause = false
      if (err.message.startsWith('cannot open device with path')) {
        this._signTransaction = setTimeout(() => this.signTransaction(rawTx, cb), 700)
        return log.info('>>>>>>> Busy: cannot open device with path, will try again')
      }
      log.error(err)
    }
  }
}

module.exports = Ledger
