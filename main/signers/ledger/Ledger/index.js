const { rlp, addHexPrefix, padToEven } = require('ethereumjs-util')
const log = require('electron-log')
const { v5: uuid } = require('uuid')
const ethSigUtil = require('eth-sig-util')
const Eth = require('@ledgerhq/hw-app-eth').default
const HID = require('node-hid')
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default

const { sign, signerCompatibility, londonToLegacy } = require('../../../transaction')
const store = require('../../../store')
const Signer = require('../../Signer')

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

// Base Paths
const BASE_PATH_LEGACY = '44\'/60\'/0\'/'
const BASE_PATH_STANDARD = `44\'/60\'/0\'/0/`
const BASE_PATH_TESTNET = '44\'/1\'/0\'/0/'

// Live Path
const BASE_PATH_LIVE = '44\'/60\'/'


class Ledger extends Signer {
  constructor (devicePath, signers, scan) {
    super()
    this.devicePath = devicePath
    this.addresses = []
    this.id = this.getId()
    this.signers = signers
    this.scan = scan
    this.type = 'ledger'
    this.status = 'initial'
    this.busyCount = 0
    this.pause = false
    this.coinbase = '0x'
    this.handlers = {}
    this.lastUse = Date.now()
    this.derivation = store('main.ledger.derivation')
    this.liveAccountLimit = store('main.ledger.liveAccountLimit')
    this.varObserver = store.observer(() => {
      if (
        this.derivation !== store('main.ledger.derivation') ||
        this.liveAccountLimit !== store('main.ledger.liveAccountLimit')
      ) {
        this.reset()
      }
    })
    this.deviceStatus()
  }

  getPath (i = 0) {
    if (this.derivation === 'legacy') {
      return (BASE_PATH_LEGACY + i)
    } else if (this.derivation === 'standard') {
      return (BASE_PATH_STANDARD + i)
    } else if (this.derivation === 'testnet') {
      return (BASE_PATH_TESTNET + i)
    } else {
      return (BASE_PATH_LIVE + i + '\'/0/0')
    }
  }

  getId () {
    return this.fingerprint() || uuid('Ledger' + this.devicePath, ns)
  }

  update () {
    if (this.invalid || this.status === 'Invalid sequence' || this.status === 'initial') return
    const id = this.getId()
    if (this.id !== id) { // Singer address representation changed
      store.removeSigner(this.id)
      this.id = id
    }
    store.updateSigner(this.summary())
  }

  async wait (time) {
    return new Promise(resolve => setTimeout(resolve, time))
  }

  async getDevice () {
    if (this.pause) throw new Error('Device access is paused')
    if (Date.now() - this.lastUse < 300) await this.wait(300)
    await this.releaseDevice()
    this.pause = true
    this.currentDevice = new HID.HID(this.devicePath)
    this.currentTransport = new TransportNodeHid(this.currentDevice)
    return new Eth(this.currentTransport)
  }

  async releaseDevice () {
    if (this.currentTransport) this.currentTransport.close()
    if (this.currentDevice) this.currentDevice.close()
    delete this.currentTransport
    delete this.currentDevice
    this.lastUse = Date.now()
    await this.wait(300)
    this.pause = false
  }

  reset () {
    this.pauseLive = true
    this.derivation = store('main.ledger.derivation')
    this.liveAccountLimit = store('main.ledger.liveAccountLimit')
    this.status = 'loading'
    this.addresses = []
    this.update()
    this.deriveAddresses()
  }

  async getDeviceAddress (i, cb = () => {}) {
    if (this.pause) return cb(new Error('Device access is paused'))
    try {
      const { address } = await this.getAddress(this.getPath(i), false, true)
      cb(null, address)
    } catch (err) {
      cb(err)
    }
  }

  async verifyAddress (index, current, display, cb = () => {}) {
    if (this.verifyActive) {
      log.info('verifyAddress Called but it\'s already active')
      return cb(new Error('verifyAddress Called but it\'s already active'))
    }
    if (this.pause) {
      log.info('Device access is paused')
      return cb(new Error('Device access is paused'))
    }
    this.verifyActive = true
    try {
      const result = await this.getAddress(this.getPath(index), display, true)
      const address = result.address.toLowerCase()
      current = current.toLowerCase()
      if (address !== current) {
        log.error(new Error('Address does not match device'))
        this.signers.remove(this.id)
        cb(new Error('Address does not match device'))
      } else {
        log.info('Address matches device')
        cb(null, true)
      }
      this.verifyActive = false
    } catch (err) {
      log.error('Verify Address Error')
      log.error(err)
      this.signers.remove(this.id)
      cb(new Error('Verify Address Error'))
      this.verifyActive = false
    }
  }

  async deriveAddresses () {
    let addresses
    if (this.pause) throw new Error('Device access is paused')
    if (this.derivingAddresses) {
      await this.wait(1000)
      return await this.deriveAddresses()
    }
    clearTimeout(this.derivingAddressesErrorTimeout)
    this.derivingAddresses = true
    try {
      // Derive addresses
      if (this.derivation === 'legacy') {
        addresses = await this._deriveLegacyAddresses()
      } else if (this.derivation === 'standard') {
        addresses = await this._deriveStandardAddresses()
      } else if (this.derivation === 'testnet') {
        addresses = await this._deriveTestnetAddresses()
      } else {
        addresses = await this._deriveLiveAddresses()
      }
      // Update signer
      this.addresses = addresses
      this.update()
      this.derivingAddresses = false
    } catch (e) {
      log.error(e)
      this.derivingAddressesErrorTimeout = setTimeout(() => {
        this.derivingAddresses = false
      }, 4000)
    }
  }

  close () {
    if (this._pollStatus) clearTimeout(this._pollStatus)
    if (this._deviceStatus) clearTimeout(this._deviceStatus)
    if (this._signMessage) clearTimeout(this._signMessage)
    if (this._signTransaction) clearTimeout(this._signTransaction)
    if (this._scanTimer) clearTimeout(this._scanTimer)
    this.releaseDevice()
    this.varObserver.remove()
    store.removeSigner(this.id)
    super.close()
  }

  pollStatus (interval = 21 * 1000) { // Detect sleep/wake
    clearTimeout(this._pollStatus)
    this._pollStatus = setTimeout(() => this.deviceStatus(), interval)
  }

  async deviceStatus () {
    if (this.status === 'Invalid sequence') return log.warn('INVALID SEQUENCE')
    this.pollStatus()
    if (this.pause || this.deviceStatusActive || this.verifyActive) return
    this.deviceStatusActive = true
    try {
      // If signer has no addresses, try deriving them
      if (!this.addresses.length) await this.deriveAddresses()
      const { address } = await this.getAddress(this.getPath(0), false, true)
      if (address !== this.coinbase || this.status !== 'ok') {
        this.coinbase = address
        this.deviceStatus()
      }
      this.status = 'ok'

      const version = (await this._getAppConfiguration()).version
      const [major, minor, patch] = (version || '1.6.1').split('.')
      this.appVersion = { major, minor, patch }

      if (!this.addresses.length) {
        this.status = 'loading'
        this.deriveAddresses()
      } else {
        this.busyCount = 0
      }
      this.update()
      this.deviceStatusActive = false
    } catch (err) {
      log.error(err)
      log.error(err.message)
      const deviceBusy = (
        err.message.startsWith('cannot open device with path') ||
        err.message === 'Device access is paused' ||
        err.message === 'Invalid channel' ||
        err.message === 'DisconnectedDevice'
      )
      if (deviceBusy) { // Device is busy, try again
        clearTimeout(this._deviceStatus)
        if (++this.busyCount > 10) {
          this.busyCount = 0
          log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
        } else {
          this._deviceStatus = setTimeout(() => this.deviceStatus(), 700)
          log.info('>>>>>>> Busy: cannot open device with path, will try again (deviceStatus)')
        }
      } else {
        this.status = err.message
        if (err.statusCode === 27904) this.status = 'Wrong application, select the Ethereum application on your Ledger'
        if (err.statusCode === 26368) this.status = 'Select the Ethereum application on your Ledger'
        if (err.statusCode === 26625 || err.statusCode === 26628) {
          this.pollStatus(3000)
          this.status = 'Confirm your Ledger is not asleep'
        }
        if (err.message === 'Cannot write to HID device') {
          this.status = 'loading'
          log.error('Device Status: Cannot write to HID device')
        }
        if (err.message === 'Invalid sequence') this.invalid = true
        if (err.message.indexOf('UNKNOWN_ERROR') > -1) this.status = 'Please reconnect this Ledger device'
        this.addresses = []
        this.update()
      }
      this.deviceStatusActive = false
    }
  }

  normalize (hex) {
    if (hex == null) return ''
    if (hex.startsWith('0x')) hex = hex.substring(2)
    if (hex.length % 2 !== 0) hex = '0' + hex
    return hex
  }

  // Standard Methods
  async signMessage (index, message, cb) {
    try {
      if (this.pause) throw new Error('Device access is paused')
      const eth = await this.getDevice()
      const result = await eth.signPersonalMessage(this.getPath(index), message.replace('0x', ''))
      let v = (result.v - 27).toString(16)
      if (v.length < 2) v = '0' + v
      cb(null, '0x' + result.r + result.s + v)
      await this.releaseDevice()
      this.busyCount = 0
    } catch (err) {
      const deviceBusy = (
        err.message.startsWith('cannot open device with path') ||
        err.message === 'Device access is paused' ||
        err.message === 'Invalid channel' ||
        err.message === 'DisconnectedDevice'
      )
      if (deviceBusy) {
        clearTimeout(this._signMessage)
        if (++this.busyCount > 20) {
          this.busyCount = 0
          return log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
        } else {
          this._signMessage = setTimeout(() => this.signMessage(index, message, cb), 700)
          return log.info('>>>>>>> Busy: cannot open device with path, will try again (signMessage)')
        }
      }
      cb(err)
      await this.releaseDevice()
      log.error(err)
    }
  }

  async signTransaction (index, rawTx, cb) {
    try {
      if (this.pause) throw new Error('Device access is paused')
      const eth = await this.getDevice()
      const signerPath = this.getPath(index)

      const compatibility = signerCompatibility(rawTx, this.summary())
      const ledgerTx = compatibility.compatible ? { ...rawTx } : londonToLegacy(rawTx)

      const signedTx = await sign(ledgerTx, tx => {
        // legacy transactions aren't RLP encoded before they're returned
        const message = tx.getMessageToSign(false)
        const legacyMessage = message[0] !== parseInt(tx.type)
        const rawTxHex = legacyMessage ? rlp.encode(message).toString('hex') : message.toString('hex')

        return eth.signTransaction(signerPath, rawTxHex)
      })

      const signedTxSerialized = signedTx.serialize().toString('hex')
      cb(null, addHexPrefix(signedTxSerialized))

      this.releaseDevice()
    } catch (err) {
      log.error(err)
      log.error(err.message)
      const deviceBusy = (
        err.message.startsWith('cannot open device with path') ||
        err.message === 'Device access is paused' ||
        err.message === 'Invalid channel' ||
        err.message === 'DisconnectedDevice'
      )
      if (deviceBusy) {
        clearTimeout(this._signTransaction)
        if (++this.busyCount > 20) {
          this.busyCount = 0
          cb(err)
          return log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
        } else {
          this._signTransaction = setTimeout(() => this.signTransaction(index, rawTx, cb), 700)
          return log.info('>>>>>>> Busy: cannot open device with path, will try again (signTransaction)')
        }
      } else {
        cb(err)
      }
      this.releaseDevice()
      log.error(err)
    }
  }

  async signTypedData (index, version, typedData, cb) {
    const versionNum = (version.match(/[Vv](\d+)/) || [])[1]

    if ((parseInt(versionNum) || 0) < 4) {
      return cb(new Error(`Invalid version (${version}), Ledger only supports eth_signTypedData version 4+`))
    }

    try {
      if (this.pause) throw new Error('Device access is paused')
      const eth = await this.getDevice()
      const signerPath = this.getPath(index)

      const { domain, types, primaryType, message } = ethSigUtil.TypedDataUtils.sanitizeData(typedData)
      const domainSeparatorHex = ethSigUtil.TypedDataUtils.hashStruct('EIP712Domain', domain, types).toString('hex')
      const hashStructMessageHex = ethSigUtil.TypedDataUtils.hashStruct(primaryType, message, types).toString('hex')

      const signature = await eth.signEIP712HashedMessage(signerPath, domainSeparatorHex, hashStructMessageHex)
      const hashedSignature = signature.r + signature.s + padToEven((signature.v - 27).toString(16))

      cb(null, addHexPrefix(hashedSignature))
    } catch (e) {
      cb(e)
    }
  }

  async getAddress (...args) {
    try {
      const eth = await this.getDevice()
      const result = await eth.getAddress(...args)
      await this.releaseDevice()
      return result
    } catch (err) {
      await this.releaseDevice()
      throw err
    }
  }

  async _getAppConfiguration () {
    try {
      const eth = await this.getDevice()
      const result = await eth.getAppConfiguration()
      await this.releaseDevice()
      return result
    } catch (err) {
      await this.releaseDevice()
      throw err
    }
  }

  async _deriveLiveAddresses () {
    let addresses = []
    this.status = 'Deriving Live Addresses'
    this.liveAddressesFound = 0
    for (let i = 0; i < this.liveAccountLimit; i++) {
      if (this.pauseLive) {
        this.status = 'loading'
        addresses = []
        this.liveAddressesFound = 0
        this.update()
        this.pauseLive = false
        this._scanTimer = setTimeout(() => this.scan(), 300)
        break
      }
      const { address } = await this.getAddress(this.getPath(i), false, false)
      log.info(`Found Ledger Live address #${i}: ${address}`)
      addresses.push(address)
      this.liveAddressesFound = addresses.length
      this.update()
    }
    return addresses
  }

  _deriveLegacyAddresses () {
    const executor = async (resolve, reject) => {
      try {
        const result = await this.getAddress(BASE_PATH_LEGACY, false, true)
        this.deriveHDAccounts(result.publicKey, result.chainCode, (err, addresses) => {
          if (err) reject(err)
          else resolve(addresses)
        })
      } catch (err) {
        reject(err)
      }
    }
    return new Promise(executor)
  }

  _deriveStandardAddresses () {
    const executor = async (resolve, reject) => {
      try {
        const result = await this.getAddress(BASE_PATH_STANDARD, false, true)
        this.deriveHDAccounts(result.publicKey, result.chainCode, (err, addresses) => {
          if (err) reject(err)
          else resolve(addresses)
        })
      } catch (err) {
        reject(err)
      }
    }
    return new Promise(executor)
  }

  _deriveTestnetAddresses () {
    const executor = async (resolve, reject) => {
      try {
        const result = await this.getAddress(BASE_PATH_TESTNET, false, true)
        this.deriveHDAccounts(result.publicKey, result.chainCode, (err, addresses) => {
          if (err) reject(err)
          else resolve(addresses)
        })
      } catch (err) {
        reject(err)
      }
    }
    return new Promise(executor)
  }

  _deriveStandardAddresses () {
    const executor = async (resolve, reject) => {
      try {
        let path
        if (store('main.hardwareDerivation') === 'mainnet') {
          path = BASE_PATH_STANDARD
        } else {
          path = BASE_PATH_STANDARD_TEST
        }
        const result = await this.getAddress(path, false, true)
        this.deriveHDAccounts(result.publicKey, result.chainCode, (err, addresses) => {
          if (err) reject(err)
          else resolve(addresses)
        })
      } catch (err) {
        reject(err)
      }
    }
    return new Promise(executor)
  }
}

module.exports = Ledger

// const { hashTypedData } = require('../../../crypt/typedDataUtils')

/// / NOTE: Commented out because Ledger does not support signTypedData at the moment
/// / see: https://github.com/floating/frame/issues/136
/// /
// async signTypedData (index, typedData, cb) {
//   if (this.pause) return cb(new Error('Device access is paused'))
//   try {
//     this.currentDevice = new HID.HID(this.devicePath)
//     this.currentTransport = new TransportNodeHid(this.currentDevice)
//     // let transport = await TransportNodeHid.open(this.devicePath)
//     const eth = new Eth(this.currentTransport)
//     const message = hashTypedData(typedData).toString('hex')

//     eth.signPersonalMessage(this.getPath(index), message.replace('0x', '')).then(result => {
//       let v = (result['v'] - 27).toString(16)
//       if (v.length < 2) v = '0' + v
//       cb(null, '0x' + result['r'] + result['s'] + v)
//       this.currentTransport.close()
//       this.currentDevice.close()
//       this.busyCount = 0
//     }).catch(err => {
//       cb(err)
//       this.currentTransport.close()
//       this.currentDevice.close()
//     })
//   } catch (err) {
//     if (err.message.startsWith('cannot open device with path')) {
//       clearTimeout(this._signMessage)
//       if (++this.busyCount > 10) {
//         this.busyCount = 0
//         return log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
//       } else {
//         this._signMessage = setTimeout(() => this.signMessage(message, cb), 700)
//         return log.info('>>>>>>> Busy: cannot open device with path, will try again (signMessage)')
//       }
//     }
//     cb(err)
//     log.error(err)
//   }
// }
