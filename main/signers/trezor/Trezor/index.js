const log = require('electron-log')
const utils = require('web3-utils')
const bip32Path = require('bip32-path')
const EthereumTx = require('ethereumjs-tx')
const store = require('../../../store')
const Signer = require('../../Signer')
const windows = require('../../../windows')

class Trezor extends Signer {
  constructor (device, api) {
    super()
    this.api = api
    this.device = device
    this.id = device.originalDescriptor.path
    this.type = 'Trezor'
    this.status = 'loading'
    this.accounts = []
    this.index = 0
    this.basePath = () => this.network === '1' ? `m/44'/60'/0'/0` : `m/44'/1'/0'/0`
    this.getPath = (i = this.index) => this.basePath() + '/' + i
    this.handlers = {}
    device.on('button', code => this.button(code))
    device.on('passphrase', cb => this.passphrase(cb))
    device.on('pin', (type, cb) => this.needPin(cb))
    device.on('disconnect', () => this.close())
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
    super.close()
  }
  button (label) {
    log.info(`Trezor button "${label}" was pressed`)
  }
  getDeviceAddress (i, cb) {
    this.device.run(session => {
      return session.ethereumGetAddress(bip32Path.fromString(this.getPath(i)).toPathArray(), true)
    }).then(result => {
      cb(null, '0x' + result.message.address)
    }).catch(err => {
      cb(err)
    })
  }
  verifyAddress (display) {
    log.info('Verify Address')
    this.device.waitForSessionAndRun(session => {
      return session.ethereumGetAddress(bip32Path.fromString(this.getPath(this.index)).toPathArray(), display)
    }).then(result => {
      let address = '0x' + result.message.address.toLowerCase()
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
    }).catch((err) => {
      log.info('Verify Address Error: ')
      // TODO: Error Notification
      log.error(err)
      this.api.unsetSigner()
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
    this.device.waitForSessionAndRun(session => {
      return session.getPublicKey(bip32Path.fromString(this.basePath()).toPathArray())
    }).then(result => {
      this.deriveHDAccounts(result.message.node.public_key, result.message.node.chain_code, cb)
    }).catch(err => {
      cb(err)
    })
  }
  deviceStatus (deep, limit = 15) {
    this.lookupAccounts((err, accounts) => {
      if (err) {
        this.status = 'loading'
        this.accounts = []
        this.index = 0
        this.update()
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
  needPassphras (cb) {
    this.status = 'Need Passphrase'
    this.update()
    this.setPin = cb
  }
  needPin (cb) {
    this.status = 'Need Pin'
    this.update()
    this.setPin = (err, pin) => {
      this.status = 'loading'
      this.update()
      cb(err, pin)
      setTimeout(() => this.deviceStatus(), 250)
    }
  }
  normalize (hex) {
    if (hex == null) return ''
    if (hex.startsWith('0x')) hex = hex.substring(2)
    if (hex.length % 2 !== 0) hex = '0' + hex
    return hex
  }
  // Standard Methods
  signMessage (message, cb) {
    this.device.waitForSessionAndRun(session => session.signEthMessage(bip32Path.fromString(this.getPath()).toPathArray(), this.normalize(message))).then(result => {
      cb(null, '0x' + result.message.signature)
    }).catch(err => {
      log.error('signMessage Error')
      log.error(err)
      if (err.message === 'Unexpected message') err = new Error('Update Trezor Firmware')
      cb(err)
    })
  }
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
      cb(err.message)
    })
  }
}

module.exports = Trezor
