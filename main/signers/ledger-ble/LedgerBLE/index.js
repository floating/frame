const log = require('electron-log')
const utils = require('web3-utils')
const EthereumTx = require('ethereumjs-tx')
const store = require('../../../store')
const Signer = require('../../Signer')
const windows = require('../../../windows')
const flex = require('../../../flex')

class LedgerBLE extends Signer {
  constructor (device, api) {
    super()
    console.log('setting up LedgerBLE device')
    this.api = api
    this.device = device
    this.id = device.id
    this.type = 'LedgerBLE'
    this.status = 'loading'
    this.accounts = []
    this.index = 0
    this.basePath = () => this.network === '1' ? `44'/60'/0'/` : `44'/1'/0'/`
    this.getPath = (i = this.index) => this.basePath() + i
    this.handlers = {}
    this.open()
    this.interval = setInterval(() => {
      this.deviceStatus()
    }, 4000)
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
    clearTimeout(this.interval)
    this.networkObserver.remove()
    this.closed = true
    super.close()
  }
  getDeviceAddress (i, cb) {
    flex.rpc('ledger.ethereumGetAddress', this.id, this.getPath(i), true, (err, result) => {
      if (err) return cb(err)
      cb(null, '0x' + result.message.address)
    })
  }
  verifyAddress (display = false, attempt = 0) {
    log.info('Verify Address, attempt: ' + attempt)
    flex.rpc('ledger.ethereumGetAddress', this.id, this.getPath(), display, (err, result) => {
      if (err) {
        if (err === 'Ledger Device is busy (lock getAddress)' && attempt < 15) {
          setTimeout(() => this.verifyAddress(display, ++attempt), 1000)
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
    flex.rpc('ledger.ethereumGetAddress', this.id, this.basePath(), false, (err, result) => {
      console.log('got result for lookupAccounts')
      console.log(err, result)
      if (err) return cb(err)
      this.deriveHDAccounts(result.publicKey, result.chainCode, cb)
    })
  }
  update () {
    if (!this.closed) super.update()
  }
  deviceStatus () {
    this.lookupAccounts((err, accounts) => {
      if (err) {
        if (err === 'Ledger Device is busy (lock getAddress)') {
          this._deviceStatus = setTimeout(() => this.deviceStatus(), 700)
        } else {
          this.status = 'loading'
          this.accounts = []
          this.index = 0
          this.update()
        }
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
  // deviceStatus (deep, limit = 15) {
  //   if (this.status === 'Invalid sequence') return
  //   this.pollStatus()
  //   if (this.pause) return
  //   this.lookupAccounts((err, accounts) => {
  //     let last = this.status
  //     if (err) {
  //       if (err.message.startsWith('cannot open device with path')) { // Device is busy, try again
  //         clearTimeout(this._deviceStatus)
  //         if (++this.busyCount > 10) {
  //           this.busyCount = 0
  //           return log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
  //         } else {
  //           this._deviceStatus = setTimeout(() => this.deviceStatus(), 700)
  //           log.info('>>>>>>> Busy: cannot open device with path, will try again (deviceStatus)')
  //         }
  //       } else {
  //         this.status = err.message
  //         if (err.statusCode === 27904) this.status = 'Wrong application, select the Ethereum application on your Ledger'
  //         if (err.statusCode === 26368) this.status = 'Select the Ethereum application on your Ledger'
  //         if (err.statusCode === 26625 || err.statusCode === 26628) {
  //           this.pollStatus(3000)
  //           this.status = 'Confirm your Ledger is not asleep and is running firmware v1.4.0+'
  //         }
  //         if (err.message === 'Cannot write to HID device') {
  //           this.status = 'loading'
  //           log.error('Device Status: Cannot write to HID device')
  //         }
  //         if (err.message === 'Invalid channel') {
  //           this.status = 'Set browser support to "NO"'
  //           log.error('Device Status: Invalid channel -> Make sure browser support is set to OFF')
  //         }
  //         if (err.message === 'Invalid sequence') this.invalid = true
  //         this.accounts = []
  //         this.index = 0
  //         if (this.status !== last) {
  //           this.update()
  //         }
  //       }
  //     } else if (accounts && accounts.length) {
  //       this.busyCount = 0
  //       if (accounts[0] !== this.coinbase || this.status !== 'ok') {
  //         this.coinbase = accounts[0]
  //         this.accounts = accounts
  //         if (this.index > accounts.length - 1) this.index = 0
  //         this.deviceStatus(true)
  //       }
  //       if (accounts.length > this.accounts.length) this.accounts = accounts
  //       this.status = 'ok'
  //       this.update()
  //     } else {
  //       this.busyCount = 0
  //       this.status = 'Unable to find accounts'
  //       this.accounts = []
  //       this.index = 0
  //       this.update()
  //     }
  //   })
  // }
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
    flex.rpc('ledger.ethereumSignMessage', this.id, this.getPath(), this.normalize(message), (err, result) => {
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
    flex.rpc('ledger.ethereumSignTransaction', this.id, this.getPath(), trezorTx, (err, result) => {
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

module.exports = LedgerBLE
