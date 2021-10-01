// @ts-nocheck

import { rlp, addHexPrefix, stripHexPrefix, padToEven } from 'ethereumjs-util'
import ethSigUtil from 'eth-sig-util'
import log from 'electron-log'

import Transport from '@ledgerhq/hw-transport'
import Eth from '@ledgerhq/hw-app-eth'

import deriveHDAccounts from '../../Signer/derive'
import { sign, signerCompatibility, londonToLegacy } from '../../../transaction'

export enum Derivation {
  live = 'live', legacy = 'legacy', standard = 'standard', testnet = 'testnet'
}

const derivationPaths: { [key: Derivation]: string } = {
  [Derivation.legacy.valueOf()]: "44'/60'/0'/",
  [Derivation.standard.valueOf()]: "44'/60'/0'/0/",
  [Derivation.testnet.valueOf()]: "44'/1'/0'/0/"
}

export default class LedgerEthereumApp {
  private eth: Eth;

  constructor (transport: Transport) {
    this.eth = new Eth(transport)
  }

  async close () {
    return this.eth.transport.close()
  }

  getPath (derivation: Derivation, index: number) {
    if (derivation === Derivation.live) {
      return `44'/60'/${index}'/0/0`
    }

    return derivationPaths[derivation] + index
  }

  async deriveAddresses (derivation: Derivation) {
    log.debug(`deriving ${derivation} Ledger addresses`)

    const path = derivationPaths[derivation]

    const executor = async (resolve: (addresses: string[]) => void, reject) => {
      try {
        const result = await this.getAddress(path, false, true)
        deriveHDAccounts(result.publicKey, result.chainCode, (err, addresses) => {
          if (err) reject(err)
          else resolve(addresses)
        })
      } catch (err) {
        reject(err)
      }
    }

    return new Promise(executor)
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

  async signMessage (path: string, message: string) {
    const rawMessage = stripHexPrefix(message)
    
    const signature = await this.eth.signPersonalMessage(path, rawMessage)
    const hashedSignature = signature.r + signature.s + padToEven((signature.v - 27).toString(16))

    return addHexPrefix(hashedSignature)
  }

  async signTypedData (path: string, typedData: string) {
    const { domain, types, primaryType, message } = ethSigUtil.TypedDataUtils.sanitizeData(typedData)
    const domainSeparatorHex = ethSigUtil.TypedDataUtils.hashStruct('EIP712Domain', domain, types).toString('hex')
    const hashStructMessageHex = ethSigUtil.TypedDataUtils.hashStruct(primaryType, message, types).toString('hex')

    const signature = await this.eth.signEIP712HashedMessage(path, domainSeparatorHex, hashStructMessageHex)
    const hashedSignature = signature.r + signature.s + padToEven((signature.v - 27).toString(16))

    return addHexPrefix(hashedSignature)
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

  async getAddress (path: string, display, chainCode ) {
    return this.eth.getAddress(path, display, chainCode)
  }

  async getAppConfiguration () {
    return this.eth.getAppConfiguration()
  }
}
