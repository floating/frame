import log from 'electron-log'
import utils from 'web3-utils'
import { padToEven, stripHexPrefix, addHexPrefix } from 'ethereumjs-util'
import { TypedData, TypedDataUtils } from 'eth-sig-util'
import TrezorConnect, { Device as TrezorDevice, UI } from 'trezor-connect'

import Signer from '../../Signer'
import { TransactionData } from '../../../../resources/domain/transaction'
import { sign, londonToLegacy, signerCompatibility, Signature } from '../../../transaction'

import { Derivation, getDerivationPath } from '../../Signer/derive'
import { TypedTransaction } from '@ethereumjs/tx'
import TrezorBridge, { ConnectError } from '../bridge'

const defaultTrezorTVersion = { major_version: 2, minor_version: 3, patch_version: 0 }
const defaultTrezorOneVersion = { major_version: 1, minor_version: 9, patch_version: 2 }

type FlexCallback<T> = (err: string | null, result: T | undefined) => void

export const Status = {
  INITIAL: 'Connecting',
  OK: 'ok',
  LOADING: 'loading',
  DERIVING: 'addresses',
  LOCKED: 'locked',
  WRONG_APP: 'Open your Ledger and select the Ethereum application',
  DISCONNECTED: 'Disconnected',
  NEEDS_RECONNECTION: 'Please reconnect this Trezor device',
  NEEDS_PIN: 'Need Pin',
  NEEDS_PASSPHRASE: 'Enter Passphrase',
  ENTERING_PASSPHRASE: 'waiting for input on device'
}

export default class Trezor extends Signer {
  private readonly connect: typeof TrezorBridge
  
  device?: TrezorDevice;
  derivation: Derivation | undefined;

  constructor (id: string, connect: typeof TrezorBridge) {
    super()

    this.id = id
    this.connect = connect
    this.type = 'trezor'
    this.status = Status.INITIAL
  }

  async open (device: TrezorDevice) {
    this.device = device

    const defaultVersion = device.features?.model === 'T' ? defaultTrezorTVersion : defaultTrezorOneVersion
    const { major_version: major, minor_version: minor, patch_version: patch } = device.features || defaultVersion
    this.appVersion = { major, minor, patch }

    const model = (device.features?.model || '').toString() === '1' ? 'One' : device.features?.model
    this.model = ['Trezor', model].join(' ').trim()

    this.deriveAddresses()

    // TODO: do we need this?
    // this will prompt for a passphrase and pin
    // return TrezorConnect.getDeviceState({ device: this.device })
  }

  close () {
    this.device = undefined

    this.emit('close')
    this.removeAllListeners()

    super.close()
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

  private handleError (err: ConnectError) {
    log.error('trezor error', err)

    this.status = err.error
    this.emit('update')
  }

  // deviceStatus () {
  //   this.lookupAddresses((err, addresses) => {
  //     if (err) {
  //       if (err === 'Device call in progress') return

  //       if (err.toLowerCase() !== 'verify address error') this.status = 'loading'
  //       if (err === 'ui-device_firmware_old') {
  //         this.status = `Update Firmware (v${[this.appVersion.major, this.appVersion.minor, this.appVersion.patch].join('.')})`
  //       }
  //       if (err === 'ui-device_bootloader_mode') this.status = 'Device in Bootloader Mode'
  //       this.addresses = []
  //       this.emit('update')
  //     } else if (addresses && addresses.length) {
  //       if (addresses[0] !== this.coinbase || this.status !== 'ok') {
  //         this.coinbase = addresses[0]
  //         this.addresses = addresses
  //         this.deviceStatus()
  //       }
  //       if (addresses.length > this.addresses.length) this.addresses = addresses
  //       this.status = 'ok'
  //       this.emit('update')
  //     } else {
  //       this.status = 'Unable to find addresses'
  //       this.addresses = []
  //       this.emit('update')
  //     }
  //   })
  // }

  verifyAddress (index: number, currentAddress: string, display = false, cb: Callback<boolean>, attempt = 0) {
    log.info('Verify Address, attempt: ' + attempt)
    let timeout = false
    const timer = setTimeout(() => {
      timeout = true

      this.close()

      log.error('The flex.rpc, trezor.ethereumGetAddress call timed out')
      cb(new Error('Address verification timed out'), undefined)
    }, 60 * 1000)

    TrezorConnect.ethereumGetAddress({ device: this.device, path: this.getPath(index), showOnTrezor: display }).then(res => {
      const err = res.success ? undefined : res.payload.error
      clearTimeout(timer)
      if (timeout) return
      if (err) {
        if (err === 'Device call in progress' && attempt < 5) {
          setTimeout(() => this.verifyAddress(index, currentAddress, display, cb, ++attempt), 1000 * (attempt + 1))
        } else {
          log.error('Verify address error:', err)
          
          this.status = (err || '').toLowerCase().match(/forbidden key path/)
            ? 'derivation path failed strict safety checks on trezor device'
            : err

          cb(new Error('Verify Address Error'), undefined)
        }
      } else {
        const verified = res.payload as { address: string }

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
    })
  }

  async getFeatures () {
    TrezorConnect.getFeatures({ device: this.device })
  }

  async deriveAddresses () {
    this.status = Status.DERIVING
    this.emit('update')

    console.trace('======> GET PUBLIC KEY')

    try {
      const publicKey = await this.connect.getPublicKey(this.basePath(), this.device)

      console.log({ publicKey })

      this.deriveHDAccounts(publicKey.publicKey, publicKey.chainCode, (err, accs) => {
        if (err) {
          this.status = Status.NEEDS_RECONNECTION
          this.emit('update')
          return
        }

        const accounts = (accs || []) as string[]
        const firstAccount = accounts[0] || ''
        if (accounts.length > this.addresses.length) {
          this.addresses = accounts
        }
        this.status = Status.OK
        this.emit('update')

        // this.verifyAddress(0, firstAccount, false, err => {
        //   if (err) {
        //     this.status = 'could not verify address, please re-connect this Trezor device'
        //   } else {
        //     this.status = Status.OK
        //     if (accounts.length > this.addresses.length) {
        //       this.addresses = accounts
        //     }
        //   }
 
        //   this.emit('update')
        // })
      })
    } catch (e: any) {
      log.error('could not get public key from Trezor', e)
      this.handleError(e)
    }
  }

  setPhrase (phrase: string) {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PASSPHRASE, payload: { save: true, value: phrase } })
    this.emit('entered:phrase')
  }

  setPin (pin: string) {
    //this.connect.pinEntered(pin)
    //this.emit('entered:pin')
  }

  // Standard Methods
  signMessage (index: number, message: string, cb: Callback<string>) {
    const rpcCallback: FlexCallback<any> = (err, result) => {
      if (err) {
        log.error('signMessage Error')
        log.error(err)
        if (err === 'Unexpected message') return cb(new Error('Update Trezor Firmware'))

        cb(new Error(err))
      } else {
        cb(null, addHexPrefix(result.signature))
      }
    }

    //flex.rpc('trezor.ethereumSignMessage', this.device.path, this.getPath(index), this.normalize(message), rpcCallback)
  }

  // Standard Methods
  signTypedData (index: number, version: string, typedData: TypedData, cb: Callback<string>) {
    const versionNum = (version.match(/[Vv](\d+)/) || [])[1]

    if ((parseInt(versionNum) || 0) < 4) {
      return cb(new Error(`Invalid version (${version}), Trezor only supports eth_signTypedData version 4+`), undefined)
    }

    const rpcCallback: FlexCallback<any> = (err, result) => {
      if (err) {
        log.error('signMessage Error')
        log.error(err)
        if (err === 'Unexpected message') return cb(new Error('Update Trezor Firmware'))

        cb(new Error(err))
      } else {
        cb(null, addHexPrefix(result.signature))
      }
    }

    if (this.isTrezorOne()) {
      // Trezor One requires hashed input
      const { types, primaryType, domain, message } = TypedDataUtils.sanitizeData(typedData)
      const domainSeparatorHash = TypedDataUtils.hashStruct('EIP712Domain', domain, types, true).toString('hex')
      const messageHash = TypedDataUtils.hashStruct(primaryType as any, message, types, true).toString('hex')

      //flex.rpc('trezor.ethereumSignTypedHash', this.device.path, this.getPath(index), typedData, domainSeparatorHash, messageHash, rpcCallback)
    } else {
      //flex.rpc('trezor.ethereumSignTypedData', this.device.path, this.getPath(index), typedData, rpcCallback)
    }
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
            const errMsg = err.toLowerCase().match(/forbidden key path/)
              ? `Turn off strict Trezor safety checks in order to use the ${this.derivation} derivation path on this chain`
              : err

            return reject(new Error(errMsg))
          }

          const { v, r, s } = result as Signature
          resolve({ v, r, s })
        }

        //flex.rpc('trezor.ethereumSignTransaction', this.device.path, path, trezorTx, rpcCallback)
      })
    })
    .then(signedTx => cb(null, addHexPrefix(signedTx.serialize().toString('hex'))))
    .catch(err => cb(err.message, undefined))
  }

  private isTrezorOne () {
    return this.model.toLowerCase().includes('one')
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
