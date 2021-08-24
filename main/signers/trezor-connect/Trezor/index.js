const log = require('electron-log')
const utils = require('web3-utils')
const { padToEven, stripHexPrefix, addHexPrefix } = require('ethereumjs-util')

const store = require('../../../store')
const Signer = require('../../Signer')
const flex = require('../../../flex')
const { sign, londonToLegacy } = require('../../../transaction')
const { v5: uuid } = require('uuid')

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

// Base Paths
const BASE_PATH_STANDARD = "m/44'/60'/0'/0"
const BASE_PATH_LEGACY = "m/44'/60'/0'"
const BASE_PATH_TESTNET = "m/44'/1'/0'/0"

class Trezor extends Signer {
  constructor (device, signers) {
    super()
    this.addresses = []
    this.signers = signers
    this.device = device
    this.id = this.getId()
    this.type = 'trezor'
    this.status = 'loading'
    this.derivationPath = store('main.trezor.derivation')
    this.basePath = () => {
      if (this.derivationPath === 'testnet') {
        return BASE_PATH_TESTNET
      } else if (this.derivationPath === 'legacy') {
        return BASE_PATH_LEGACY
      } else {
        return BASE_PATH_STANDARD
      }
    }
    this.getPath = (i = 0) => this.basePath() + '/' + i
    this.handlers = {}
    this.deviceStatus()
    this.derivationPathObserver = store.observer(() => {
      if (this.derivationPath !== store('main.trezor.derivation')) {
        this.derivationPath = store('main.trezor.derivation')
        this.reset()
        this.deviceStatus()
      }
    })
    setTimeout(() => {
      this.deviceStatus()
    }, 2000)
  }

  getId () {
    return this.fingerprint() || uuid('Trezor' + this.device.path, ns)
  }

  update () {
    if (this.closed) return
    const id = this.getId()
    if (this.id !== id) { // Singer address representation changed
      store.removeSigner(this.id)
      this.id = id
    }
    store.updateSigner(this.summary())
  }

  reset () {
    this.status = 'loading'
    this.addresses = []
    this.update()
  }

  deviceStatus () {
    this.lookupAddresses((err, addresses) => {
      if (err) {
        if (err === 'Device call in progress') return
        this.status = 'loading'
        if (err === 'ui-device_firmware_old') this.status = `Update Firmware (v${this.device.firmwareRelease.version.join('.')})`
        if (err === 'ui-device_bootloader_mode') this.status = 'Device in Bootloader Mode'
        this.addresses = []
        this.update()
      } else if (addresses && addresses.length) {
        if (addresses[0] !== this.coinbase || this.status !== 'ok') {
          this.coinbase = addresses[0]
          this.addresses = addresses
          this.deviceStatus()
        }
        if (addresses.length > this.addresses.length) this.addresses = addresses
        this.status = 'ok'
        this.update()
      } else {
        this.status = 'Unable to find addresses'
        this.addresses = []
        this.update()
      }
    })
  }

  close () {
    this.derivationPathObserver.remove()
    this.closed = true
    store.removeSigner(this.id)
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

  verifyAddress (index, current, display = false, cb = () => {}, attempt = 0) {
    log.info('Verify Address, attempt: ' + attempt)
    let timeout = false
    const timer = setTimeout(() => {
      timeout = true
      this.signers.remove(this.id)
      log.error('The flex.rpc, trezor.ethereumGetAddress call timed out')
      cb(new Error('Address verification timed out'))
    }, 60 * 1000)
    flex.rpc('trezor.ethereumGetAddress', this.device.path, this.getPath(index), display, (err, result) => {
      clearTimeout(timer)
      if (timeout) return
      if (err) {
        if (err === 'Device call in progress' && attempt < 5) {
          setTimeout(() => this.verifyAddress(index, current, display, cb, ++attempt), 1000 * (attempt + 1))
        } else {
          log.info('Verify Address Error: ')
          // TODO: Error Notification
          log.error(err)
          this.signers.remove(this.id)
          cb(new Error('Verify Address Error'))
        }
      } else {
        const address = result.address ? result.address.toLowerCase() : ''
        const current = this.addresses[index] ? this.addresses[index].toLowerCase() : ''
        log.info('Frame has the current address as: ' + current)
        log.info('Trezor is reporting: ' + address)
        if (address !== current) {
          // TODO: Error Notification
          log.error(new Error('Address does not match device'))
          this.signers.remove(this.id)
          cb(new Error('Address does not match device'))
        } else {
          log.info('Address matches device')
          cb(null, true)
        }
      }
    })
  }

  lookupAddresses (cb) {
    flex.rpc('trezor.getPublicKey', this.device.path, this.basePath(), (err, result) => {
      if (err) return cb(err)
      this.deriveHDAccounts(result.publicKey, result.chainCode, cb)
    })
  }

  needPhrase (cb) {
    this.status = 'Enter Passphrase'
    this.update()
    this.trezorPhrase = (phrase) => {
      this.status = 'loading'
      this.update()
      flex.rpc('trezor.inputPhrase', this.device.path, phrase, err => {
        if (err) log.error(err)
        setTimeout(() => this.deviceStatus(), 1000)
      })
    }
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
    return (hex && padToEven(stripHexPrefix(hex))) || ''
  }

  hexToBuffer (hex) {
    return Buffer.from(this.normalize(hex), 'hex')
  }

  // Standard Methods
  signMessage (index, message, cb) {
    flex.rpc('trezor.ethereumSignMessage', this.device.path, this.getPath(index), this.normalize(message), (err, result) => {
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

  _normalizeTransaction (chainId, tx) {
    const txJson = tx.toJSON()

    const unsignedTx = {
      nonce: this.normalize(txJson.nonce),
      gasLimit: this.normalize(txJson.gasLimit),
      to: this.normalize(txJson.to),
      value: this.normalize(txJson.value),
      data: this.normalize(txJson.data),
      chainId: utils.hexToNumber(chainId)
    }

    const optionalFields = ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']

    optionalFields.forEach(field => {
      if (txJson[field]) {
        unsignedTx[field] = this.normalize(txJson[field])
      }
    })

    return unsignedTx
  }

  signTransaction (index, rawTx, cb) {
    const compatibility = signerCompatibility(rawTx, this.summary())
    const compatibleTx = compatibility.compatible ? { ...rawTx } : londonToLegacy(rawTx)


    sign(compatibleTx, () => {
      return new Promise((resolve, reject) => {
        const trezorTx = this._normalizeTransaction(tx)
        const path = this.getPath(index)

        flex.rpc('trezor.ethereumSignTransaction', this.device.path, path, trezorTx, (err, result) => {
          return err
            ? reject(err)
            : resolve({ v: result.v, r: result.r, s: result.s })
        })
      })
    })
    .then(signedTx => cb(null, addHexPrefix(signedTx.serialize().toString('hex'))))
    .catch(err => cb(err.message))
  }
}

module.exports = Trezor
