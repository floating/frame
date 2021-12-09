import log from 'electron-log'
import utils from 'web3-utils'
import { padToEven, stripHexPrefix, addHexPrefix } from 'ethereumjs-util'
import { Device as TrezorDevice } from 'trezor-connect'

import Signer from '../../Signer'
import flex from '../../../flex'
import { sign, londonToLegacy, signerCompatibility, TransactionData } from '../../../transaction'

// @ts-ignore
import { v5 as uuid } from 'uuid'
import { Derivation, getDerivationPath } from '../../Signer/derive'
import { TypedTransaction } from '@ethereumjs/tx'

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

const defaultTrezorTVersion = { major_version: 2, minor_version: 3, patch_version: 0 }
const defaultTrezorOneVersion = { major_version: 1, minor_version: 9, patch_version: 2 }

type FlexCallback = (err: string | null, result: any | undefined) => void

export default class Trezor extends Signer {
  private closed = false;
  
  device: TrezorDevice;
  derivation: Derivation | undefined;

  constructor (device: TrezorDevice) {
    super()

    this.addresses = []
    this.device = device
    this.id = this.getId()

    const defaultVersion = device.features?.model === 'T' ? defaultTrezorTVersion : defaultTrezorOneVersion
    const { major_version: major, minor_version: minor, patch_version: patch } = device.features || defaultVersion
    this.appVersion = { major, minor, patch }

    const model = (device.features?.model || '').toString() === '1' ? 'One' : device.features?.model
    this.model = ['Trezor', model].join(' ').trim()

    this.type = 'trezor'
    this.status = 'loading'
  }

  async open () {
    this.closed = false

    this.reset()
    this.deviceStatus()
    
    setTimeout(() => {
      this.deviceStatus()
    }, 2000)
  }

  close () {
    this.closed = true

    this.emit('close')
    this.removeAllListeners()

    super.close()
  }

  update () {
    if (this.closed) return

    this.emit('update')
  }

  reset () {
    this.status = 'loading'
    this.addresses = []
    this.update()
  }

  private getId () {
    return uuid('Trezor' + this.device.path, ns)
  }

  private getPath (index: number) {
    return this.basePath() + '/' + index.toString()
  }

  private basePath () {
    if (!this.derivation) {
      throw new Error('attempted to get base path with unknown derivation!')
    }

    return `m/${getDerivationPath(this.derivation)}`.replace(/\/+$/,'')
  }

  deviceStatus () {
    this.lookupAddresses((err, addresses) => {
      if (err) {
        if (err === 'Device call in progress') return
        this.status = 'loading'
        if (err === 'ui-device_firmware_old') this.status = `Update Firmware (v${this.device.firmwareRelease.release.version.join('.')})`
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

  verifyAddress (index: number, currentAddress: string, display = false, cb: Callback<boolean>, attempt = 0) {
    log.info('Verify Address, attempt: ' + attempt)
    let timeout = false
    const timer = setTimeout(() => {
      timeout = true

      this.close()

      log.error('The flex.rpc, trezor.ethereumGetAddress call timed out')
      cb(new Error('Address verification timed out'), undefined)
    }, 60 * 1000)

    const rpcCallback: FlexCallback = (err, result) => {
      clearTimeout(timer)
      if (timeout) return
      if (err) {
        if (err === 'Device call in progress' && attempt < 5) {
          setTimeout(() => this.verifyAddress(index, currentAddress, display, cb, ++attempt), 1000 * (attempt + 1))
        } else {
          log.error('Verify address error: ', err)
          
          this.close()

          cb(new Error('Verify Address Error'), undefined)
        }
      } else {
        const address = result.address ? result.address.toLowerCase() : ''
        const current = this.addresses[index] ? this.addresses[index].toLowerCase() : ''
        log.info('Frame has the current address as: ' + current)
        log.info('Trezor is reporting: ' + address)
        if (address !== current) {
          // TODO: Error Notification
          log.error(new Error('Address does not match device'))
          
          this.close()

          cb(new Error('Address does not match device'), undefined)
        } else {
          log.info('Address matches device')
          cb(null, true)
        }
      }
    }

    flex.rpc('trezor.ethereumGetAddress', this.device.path, this.getPath(index), display, rpcCallback)
  }

  lookupAddresses (cb: FlexCallback) {
    const rpcCallback: FlexCallback = (err, result) => {
      return err
        ? cb(err, undefined)
        : this.deriveHDAccounts(result.publicKey, result.chainCode, cb)
    }

    flex.rpc('trezor.getPublicKey', this.device.path, this.basePath(), rpcCallback)
  }

  setPhrase (phrase: string) {
    const rpcCallback: FlexCallback = err => {
      if (err) log.error(err)
      setTimeout(() => this.deviceStatus(), 1000)
    }

    this.status = 'loading'
    this.update()

    flex.rpc('trezor.inputPhrase', this.device.path, phrase, rpcCallback)
  }

  setPin (pin: string) {
    const rpcCallback: FlexCallback = err => {
      if (err) log.error(err)
      setTimeout(() => this.deviceStatus(), 250)
    }

    this.status = 'loading'
    this.update()

    flex.rpc('trezor.inputPin', this.device.path, pin, rpcCallback)
  }

  // Standard Methods
  signMessage (index: number, message: string, cb: Callback<string>) {
    const rpcCallback: Callback<any> = (err, result) => {
      if (err) {
        log.error('signMessage Error')
        log.error(err)
        if (err.message === 'Unexpected message') err = new Error('Update Trezor Firmware')
        cb(err, undefined)
      } else {
        cb(null, '0x' + result.signature)
      }
    }

    flex.rpc('trezor.ethereumSignMessage', this.device.path, this.getPath(index), this.normalize(message), rpcCallback)
  }

  signTransaction (index: number, rawTx: TransactionData, cb: Callback<string>) {
    if (this.appVersion.major >= 2 && this.derivation !== Derivation.testnet && rawTx.chainLayer === 'testnet') {
      return cb(new Error('Only the Testnet derivation path is supported on testnets'), undefined)
    }

    const compatibility = signerCompatibility(rawTx, this.summary())
    const compatibleTx = compatibility.compatible ? { ...rawTx } : londonToLegacy(rawTx)

    sign(compatibleTx, tx => {
      return new Promise((resolve, reject) => {
        const trezorTx = this.normalizeTransaction(rawTx.chainId, tx)
        const path = this.getPath(index)

        const rpcCallback: Callback<any> = (err, result) => {
          return err
            ? reject(err)
            : resolve({ v: result.v, r: result.r, s: result.s })
        }

        flex.rpc('trezor.ethereumSignTransaction', this.device.path, path, trezorTx, rpcCallback)
      })
    })
    .then(signedTx => cb(null, addHexPrefix(signedTx.serialize().toString('hex'))))
    .catch(err => cb(err.message, undefined))
  }

  private normalize (hex: string) {
    return (hex && padToEven(stripHexPrefix(hex))) || ''
  }

  private normalizeTransaction (chainId: string, tx: TypedTransaction) {
    const txJson = tx.toJSON()

    const unsignedTx = {
      nonce: this.normalize(txJson.nonce || ''),
      gasLimit: this.normalize(txJson.gasLimit || ''),
      to: this.normalize(txJson.to || ''),
      value: this.normalize(txJson.value || ''),
      data: this.normalize(txJson.data || ''),
      chainId: utils.hexToNumber(chainId)
    }

    const optionalFields = ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']

    optionalFields.forEach(field => {
      // @ts-ignore
      const val: string = txJson[field]
      if (val) {
        // @ts-ignore
        unsignedTx[field] = this.normalize(val)
      }
    })

    return unsignedTx
  }
}
