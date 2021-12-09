import log from 'electron-log'
import utils from 'web3-utils'
import { padToEven, stripHexPrefix, addHexPrefix } from 'ethereumjs-util'
import { Device as TrezorDevice } from 'trezor-connect'

import Signer from '../../Signer'
import flex from '../../../flex'
import { sign, londonToLegacy, signerCompatibility, TransactionData, Signature } from '../../../transaction'

// @ts-ignore
import { v5 as uuid } from 'uuid'
import { Derivation, getDerivationPath } from '../../Signer/derive'
import { TypedTransaction } from '@ethereumjs/tx'

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

const defaultTrezorTVersion = { major_version: 2, minor_version: 3, patch_version: 0 }
const defaultTrezorOneVersion = { major_version: 1, minor_version: 9, patch_version: 2 }

type FlexCallback<T> = (err: string | null, result: T | undefined) => void

interface PublicKeyResponse {
  chainCode: string,
  publicKey: string,
}

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

        if (err.toLowerCase() !== 'verify address error') this.status = 'loading'
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

    const rpcCallback: FlexCallback<{ address: string }> = (err, result) => {
      clearTimeout(timer)
      if (timeout) return
      if (err) {
        if (err === 'Device call in progress' && attempt < 5) {
          setTimeout(() => this.verifyAddress(index, currentAddress, display, cb, ++attempt), 1000 * (attempt + 1))
        } else {
          log.error('Verify address error:', err)
          
          this.status = (err || '').toLowerCase().match(/forbidden key path/)
            ? 'derivation path failed strict safety checks'
            : err

          cb(new Error('Verify Address Error'), undefined)
        }
      } else {
        const verified = result as { address: string }

        const address = verified.address ? verified.address.toLowerCase() : ''
        const current = (currentAddress || '').toLowerCase()

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

  lookupAddresses (cb: FlexCallback<Array<string>>) {
    const rpcCallback: FlexCallback<PublicKeyResponse> = (err, result) => {
      if (err) return cb(err, undefined)

      const key = result as PublicKeyResponse
      this.deriveHDAccounts(key.publicKey, key.chainCode, (err, accounts: any) => {
        if (err) return cb(err.message, undefined)

        const firstAccount = accounts[0] || ''
        this.verifyAddress(0, firstAccount, false, err => {
          if (err) return cb(err.message, undefined)
          cb(null, accounts)
        })
      })
    }

    flex.rpc('trezor.getPublicKey', this.device.path, this.basePath(), rpcCallback)
  }

  setPhrase (phrase: string) {
    const rpcCallback: FlexCallback<void> = err => {
      if (err) log.error(err)
      setTimeout(() => this.deviceStatus(), 1000)
    }

    this.status = 'loading'
    this.update()

    flex.rpc('trezor.inputPhrase', this.device.path, phrase, rpcCallback)
  }

  setPin (pin: string) {
    const rpcCallback: FlexCallback<void> = err => {
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
    const compatibility = signerCompatibility(rawTx, this.summary())
    const compatibleTx = compatibility.compatible ? { ...rawTx } : londonToLegacy(rawTx)

    sign(compatibleTx, tx => {
      return new Promise((resolve, reject) => {
        const trezorTx = this.normalizeTransaction(rawTx.chainId, tx)
        const path = this.getPath(index)

        const rpcCallback: FlexCallback<Signature> = (err, result) => {
          if (err) {
            if (err.toLowerCase().match(/forbidden key path/)) {
              return reject(new Error(`Turn off strict Trezor safety checks in order to use the ${this.derivation} derivation path on this chain`))
            }

            return reject(new Error(err))
          }

          const { v, r, s } = result as Signature
          resolve({ v, r, s })
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
