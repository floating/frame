// @ts-nocheck
import log from 'electron-log'
import { rlp, addHexPrefix } from 'ethereumjs-util'
import { v5 as uuid } from 'uuid'

import HID from 'node-hid'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import Eth from '@ledgerhq/hw-app-eth'

import Signer from '../../Signer'


const { sign, signerCompatibility, londonToLegacy } = require('../../../transaction')
// const store = require('../../../store')

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

// Base Paths
const BASE_PATH_LEGACY = '44\'/60\'/0\'/'
const BASE_PATH_STANDARD = `44\'/60\'/0\'/0/`
const BASE_PATH_TESTNET = '44\'/1\'/0\'/0/'

// Live Path
const BASE_PATH_LIVE = '44\'/60\'/'


export default class Ledger extends Signer {
  private eth: Eth | undefined;
  private devicePath: string;

  private coinbase = '0x'

  constructor (devicePath: string) {
    super()

    this.devicePath = devicePath

    this.addresses = []
    this.id = uuid('Ledger' + this.devicePath, ns)

    this.type = 'ledger'
    this.status = 'initial'
    
    // this.lastUse = Date.now()
    // this.busyCount = 0
    // this.pause = false
    
    // this.derivation = store('main.ledger.derivation')
    // this.liveAccountLimit = store('main.ledger.liveAccountLimit')
    // this.varObserver = store.observer(() => {
    //   if (
    //     this.derivation !== store('main.ledger.derivation') ||
    //     this.liveAccountLimit !== store('main.ledger.liveAccountLimit')
    //   ) {
    //     this.reset()
    //   }
    // })
    // this.deviceStatus()
  }

  async connect () {
    return TransportNodeHid.open(this.devicePath).then(transport => {
      return this.eth = new Eth(transport)
    })
  }

  close () {
    if (this.eth) {
      this.eth.transport.close()
      this.eth = null
    }

    this.removeAllListeners()

    if (this._pollStatus) clearTimeout(this._pollStatus)
    if (this._deviceStatus) clearTimeout(this._deviceStatus)
    if (this._signMessage) clearTimeout(this._signMessage)
    if (this._signTransaction) clearTimeout(this._signTransaction)
    if (this._scanTimer) clearTimeout(this._scanTimer)
    
    super.close()
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

  update () {
    if (this.invalid || this.status === 'Invalid sequence' || this.status === 'initial') return
    store.updateSigner(this.summary())
  }

  updateStatus (status) {
    this.status = status

    this.emit('status', status)
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
      const message = "verifyAddress called but it's already active"

      log.info(message)
      return cb(new Error(message))
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

  async deriveAddresses (accountLimit) {
    // live addresses are derived one by one so it will emit its own events
    if (this.derivation === 'live') {
      this.updateStatus('Deriving Live Addresses')
      return this._deriveLiveAddresses(accountLimit)
    }

    this.updateStatus('loading')

    if (this.derivation === 'legacy') {
      this.addresses = await this._deriveLegacyAddresses()
    } else if (this.derivation === 'standard') {
      this.addresses = await this._deriveStandardAddresses()
    } else if (this.derivation === 'testnet') {
      this.addresses = await this._deriveTestnetAddresses()
    }

    return this.addresses
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

  async getAddress (...args) {
    return this.eth.getAddress(...args)
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

  async _deriveLiveAddresses (accountLimit) {
    this.liveAddressesFound = 0

    for (let i = 0; i < accountLimit; i++) {
      const { address } = await this.getAddress(this.getPath(i), false, false)

      log.info(`Found Ledger Live address #${i}: ${address}`)

      this.addresses = [...this.addresses, address]
      this.liveAddressesFound = this.addresses.length

      this.updateStatus('ok')
      this.emit('addresses', this.addresses)
    }
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
