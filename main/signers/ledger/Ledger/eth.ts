// @ts-nocheck

const { rlp, addHexPrefix } = require('ethereumjs-util')
const log = require('electron-log')
const { v5: uuid } = require('uuid')

import HID from 'node-hid'
import Transport from '@ledgerhq/hw-transport'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import Eth from '@ledgerhq/hw-app-eth'

import { sign, signerCompatibility, londonToLegacy } from '../../../transaction'


const store = require('../../../store')
const Signer = require('../../Signer')

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

// Base Paths
const BASE_PATH_LEGACY = '44\'/60\'/0\'/'
const BASE_PATH_STANDARD = `44\'/60\'/0\'/0/`
const BASE_PATH_TESTNET = '44\'/1\'/0\'/0/'

// Live Path
const BASE_PATH_LIVE = '44\'/60\'/'


class LedgerEthereumApp {
  private transport: Transport;
  private devicePath: string;
  private eth: Eth;

  constructor (devicePath: string) {
    this.transport = new TransportNodeHid(new HID.HID(devicePath))

    this.devicePath = devicePath
    this.eth = new Eth(this.transport)
  }

  async verifyAddress (path: string, currentAddress: string, display: boolean, cb = (err: Error | null, result: boolean | undefined) => {}) {
    try {
      const result = await this.getAddress(path, display, true)
      
      if (result.address.toLowerCase() !== currentAddress.toLowerCase()) {
        log.error(new Error(`Ledger address ${currentAddress} does not match device`))
        return cb(new Error('Address does not match device'), false)
      }
      
      cb(null, true)
    } catch (err: any) {
      log.error(new Error(`could not verify Ledger address: ${err.message}`))
      cb(new Error('Verify Address Error'), false)
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
    this.transport.close()
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

  async signTransaction (path: string, rawTx: any, cb: (err: any, ...signature: string[]) => void) {
    const compatibility = signerCompatibility(rawTx, this.summary())
    const ledgerTx = compatibility.compatible ? { ...rawTx } : londonToLegacy(rawTx)

    try {
      const signedTx = await sign(ledgerTx, tx => {
        // legacy transactions aren't RLP encoded before they're returned
        const message = tx.getMessageToSign(false)
        const legacyMessage = message[0] !== tx.type
        const rawTxHex = legacyMessage ? rlp.encode(message).toString('hex') : message.toString('hex')

        return this.eth.signTransaction(path, rawTxHex)
      })

      const signedTxSerialized = signedTx.serialize().toString('hex')
      cb(null, addHexPrefix(signedTxSerialized))
    } catch (e) {
      cb(e)
    }
  }

  async getAddress (path: string, display = false, chainCode = false) {
    return this.eth.getAddress(path, display, chainCode)
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
