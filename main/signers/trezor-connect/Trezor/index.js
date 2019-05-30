const log = require('electron-log')
const utils = require('web3-utils')
const EthereumTx = require('ethereumjs-tx')
const store = require('../../../store')
const Signer = require('../../Signer')
const windows = require('../../../windows')
const flex = require('../../../flex')

class Trezor extends Signer {
  constructor (device, api) {
    super()
    this.api = api
    this.device = device
    this.id = device.path
    this.type = 'Trezor'
    this.status = 'loading'
    this.accounts = []
    this.index = 0
    this.basePath = () => this.network === '1' ? `m/44'/60'/0'/0` : `m/44'/1'/0'/0`
    this.getPath = (i = this.index) => this.basePath() + '/' + i
    this.handlers = {}
    this.open()
    this.networkObserver = store.observer(() => {
      if (this.network !== store('main.connection.network')) {
        this.network = store('main.connection.network')
        this.status = 'loading'
        this.accounts = []
        this.update()
        if (this.network) this.deviceStatus()
      }
    })
  }
  close () {
    this.networkObserver.remove()
    this.closed = true
    super.close()
  }
  button (label) {
    log.info(`Trezor button "${label}" was pressed`)
  }
  getDeviceAddress (i, cb) {
    flex.rpc('trezor.ethereumGetAddress', this.device.path, this.getPath(i), true, (err, result) => {
      if (err) return cb(err)
      cb(null, '0x' + result.message.address)
    })
  }
  verifyAddress (display = false, attempt = 0) {
    log.info('Verify Address, attempt: ' + attempt)
    flex.rpc('trezor.ethereumGetAddress', this.device.path, this.getPath(), display, (err, result) => {
      if (err) {
        if (err === 'Device call in progress' && attempt < 5) {
          setTimeout(() => {
            this.verifyAddress(display, ++attempt)
          }, 500)
        } else {
          log.info('Verify Address Error: ')
          // TODO: Error Notification
          log.error(err)
          this.api.unsetSigner()
        }
      } else {
        let address = result.address ? result.address.toLowerCase() : ''
        let current = this.accounts[this.index].toLowerCase()
        log.info('Frame has the current address as: ' + current)
        log.info('Trezor is reporting: ' + address)
        if (address !== current) {
          // TODO: Error Notification
          log.error(new Error('Address does not match device'))
          this.api.unsetSigner()
        } else {
          log.info('Address matches device')
        }
      }
    })
  }
  setIndex (i, cb) {
    this.index = i
    this.requests = {} // TODO Decline these requests before clobbering them
    windows.broadcast('main:action', 'updateSigner', this.summary())
    cb(null, this.summary())
    this.verifyAddress()
  }
  lookupAccounts (cb) {
    flex.rpc('trezor.getPublicKey', this.device.path, this.basePath(), (err, result) => {
      if (err) return cb(err)
      cb(null, this.deriveHDAccounts(result.publicKey, result.chainCode))
    })
  }
  update () {
    if (!this.closed) super.update()
  }
  deviceStatus () {
    this.lookupAccounts((err, accounts) => {
      if (err) {
        this.status = 'loading'
        if (err === 'ui-device_firmware_old') this.status = `Update Firmware (v${this.device.firmwareRelease.version.join('.')})`
        if (err === 'ui-device_bootloader_mode') this.status = `Device in Bootloader Mode`
        this.accounts = []
        this.index = 0
        this.update()
      } else if (accounts && accounts.length) {
        if (accounts[0] !== this.coinbase || this.status !== 'ok') {
          this.coinbase = accounts[0]
          this.accounts = accounts
          if (this.index > accounts.length - 1) this.index = 0
          this.deviceStatus()
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
  needPin () {
    this.status = 'Need Pin'
    this.update()
    this.setPin = (pin) => {
      this.status = 'loading'
      this.update()
      flex.rpc('trezor.inputPin', this.device.path, pin, err => {
        if (err) log.error(err)
        setTimeout(() => this.deviceStatus(), 250)
      })
    }
  }
  normalize (hex) {
    if (hex == null) return ''
    if (hex.startsWith('0x')) hex = hex.substring(2)
    if (hex.length % 2 !== 0) hex = '0' + hex
    return hex
  }
  hexToBuffer (hex) {
    return Buffer.from(this.normalize(hex), 'hex')
  }
  // Standard Methods
  signMessage (message, cb) {
    flex.rpc('trezor.ethereumSignMessage', this.device.path, this.getPath(), this.normalize(message), (err, result) => {
      if (err) {
        log.error('signMessage Error')
        log.error(err)
        if (err.message === 'Unexpected message') err = new Error('Update Trezor Firmware')
        cb(err)
      } else {
        cb(null, '0x' + result.signature)
      }
    })
  }
  signTransaction (rawTx, cb) {
    if (parseInt(this.network) !== utils.hexToNumber(rawTx.chainId)) return cb(new Error('Signer signTx network mismatch'))
    const trezorTx = {
      nonce: this.normalize(rawTx.nonce),
      gasPrice: this.normalize(rawTx.gasPrice),
      gasLimit: this.normalize(rawTx.gas),
      to: this.normalize(rawTx.to),
      value: this.normalize(rawTx.value),
      data: this.normalize(rawTx.data),
      chainId: utils.hexToNumber(rawTx.chainId)
    }
    flex.rpc('trezor.ethereumSignTransaction', this.device.path, this.getPath(), trezorTx, (err, result) => {
      if (err) return cb(err.message)
      const tx = new EthereumTx({
        nonce: this.hexToBuffer(rawTx.nonce),
        gasPrice: this.hexToBuffer(rawTx.gasPrice),
        gasLimit: this.hexToBuffer(rawTx.gas),
        to: this.hexToBuffer(rawTx.to),
        value: this.hexToBuffer(rawTx.value),
        data: this.hexToBuffer(rawTx.data),
        v: this.hexToBuffer(result.v),
        r: this.hexToBuffer(result.r),
        s: this.hexToBuffer(result.s)
      })
      cb(null, '0x' + tx.serialize().toString('hex'))
    })
  }
}

module.exports = Trezor
