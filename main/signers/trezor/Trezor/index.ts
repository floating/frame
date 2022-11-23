import log from 'electron-log'
import { hexToInt } from '../../../../resources/utils'
import { padToEven, stripHexPrefix, addHexPrefix } from 'ethereumjs-util'
import { TypedData, TypedDataUtils } from 'eth-sig-util'
import type { Device as TrezorDevice } from 'trezor-connect'

// @ts-ignore
import { v5 as uuid } from 'uuid'

import Signer from '../../Signer'
import { TransactionData } from '../../../../resources/domain/transaction'
import { sign, londonToLegacy, signerCompatibility } from '../../../transaction'

import { Derivation, getDerivationPath } from '../../Signer/derive'
import TrezorBridge, { DeviceError } from '../bridge'

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

const defaultTrezorTVersion = { major_version: 2, minor_version: 3, patch_version: 0 }
const defaultTrezorOneVersion = { major_version: 1, minor_version: 9, patch_version: 2 }

export const Status = { 
  INITIAL: 'Connecting',
  OK: 'ok',
  LOADING: 'loading',
  DERIVING: 'addresses',
  LOCKED: 'locked',
  DISCONNECTED: 'Disconnected',
  NEEDS_RECONNECTION: 'Please reconnect this Trezor device',
  NEEDS_PIN: 'Need Pin',
  NEEDS_PASSPHRASE: 'Enter Passphrase',
  ENTERING_PASSPHRASE: 'waiting for input on device'
}

function createErrorMessage (message: string, cause: string = '') {
  // the cause may need to be transformed into a more informative message
  return cause.toLowerCase().match(/forbidden key path/)
    ? 'derivation path failed strict safety checks on trezor device'
    : message
}

export default class Trezor extends Signer {
  readonly path: string

  device?: TrezorDevice
  derivation: Derivation | undefined

  constructor (path: string) {
    super()

    this.path = path
    this.id = Trezor.generateId(path)
    this.type = 'trezor'
    this.status = Status.INITIAL
  }

  static generateId (path: string) {
    return uuid('Trezor' + path, ns)
  }

  async open (device: TrezorDevice) {
    this.device = device
    this.status = Status.INITIAL
    this.emit('update')

    try {
      const features = await TrezorBridge.getFeatures({ device })

      const defaultVersion = features?.model === 'T' ? defaultTrezorTVersion : defaultTrezorOneVersion
      const { major_version: major, minor_version: minor, patch_version: patch } = features || defaultVersion
      this.appVersion = { major, minor, patch }

      const model = (features?.model || '').toString() === '1' ? 'One' : features?.model
      this.model = ['Trezor', model].join(' ').trim()
    } catch (e) {
      this.handleUnrecoverableError()

      throw e
    }

    try {
      // this prompts a login of pin and/or passphrase
      await TrezorBridge.getAccountInfo(device, this.getPath(0))
    } catch (e) {
      const err = e as DeviceError
      this.handleError(new DeviceError(createErrorMessage(Status.NEEDS_RECONNECTION, err.message), 'ACCOUNT_ACCESS_FAILURE'))

      throw e
    }
  }

  close () {
    this.device = undefined

    this.emit('close')
    this.removeAllListeners()

    super.close()
  }

  summary () {
    const summary = super.summary()

    return {
      ...summary,
      capabilities: this.device?.features?.capabilities || []
    }
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

  private handleUnrecoverableError () {
    this.handleError(new DeviceError('Unrecoverable error', 'UNRECOVERABLE'))
  }

  private handleError (error: DeviceError) {
    const errorStatusMap = {
      ADDRESS_NO_MATCH_DEVICE: Status.NEEDS_RECONNECTION,
      UNRECOVERABLE: Status.NEEDS_RECONNECTION,
      ADDRESS_VERIFICATION_FAILURE: Status.NEEDS_RECONNECTION,
      ACCOUNT_ACCESS_FAILURE: Status.NEEDS_RECONNECTION
    }
    const newStatus = errorStatusMap[error.code as keyof typeof errorStatusMap]
    if (newStatus) {
      this.status = newStatus
    }

    this.emit('update')
  }

  async verifyAddress (index: number, currentAddress: string = '', display = false, cb: Callback<boolean>) {
    const waitForInput = setTimeout(() => {
      log.error('Trezor address verification timed out')
      cb(new Error('Address verification timed out'))
    }, 60_000)

    try {
      if (!this.device) {
        throw new Error('Trezor not connected')
      }

      const reportedAddress = await TrezorBridge.getAddress(this.device, this.getPath(index), display)

      clearTimeout(waitForInput)

      const current = currentAddress.toLowerCase()

      if (reportedAddress !== current) {
        log.error(`address from Frame (${current}) does not match address from Trezor device (${reportedAddress})`)
        
        this.handleError(new DeviceError('address does not match device, reconnect your Trezor', 'ADDRESS_NO_MATCH_DEVICE'))

        cb(new Error('Address does not match device'), undefined)
      } else {
        log.verbose('Trezor address matches device')
        cb(null, true)
      }
    } catch (e: unknown) {
      clearTimeout(waitForInput)

      const err = e as DeviceError

      log.error('error verifying Trezor address', err)
      this.handleError(new DeviceError(createErrorMessage('could not verify address, reconnect your Trezor', err.message), 'ADDRESS_VERIFICATION_FAILURE'))

      cb(new Error(err.message))
    }
  }

  async deriveAddresses () {
    this.status = Status.DERIVING
    this.emit('update')

    try {
      if (!this.device) {
        throw new Error('Trezor not connected')
      }

      const publicKey = await TrezorBridge.getPublicKey(this.device, this.basePath())

      this.deriveHDAccounts(publicKey.publicKey, publicKey.chainCode, (err, accounts = []) => {
        if (err) {
          this.handleError(new DeviceError('could not derive addresses, reconnect your Trezor', 'DERIVATION_FAILURE'))
          return
        }

        const firstAccount = accounts[0] || ''

        this.verifyAddress(0, firstAccount, false, err => {
          if (!err) {
            this.status = Status.OK
            this.addresses = accounts
          }
 
          this.emit('update')
        })
      })
    } catch (e: unknown) {
      log.error('could not get public key from Trezor', e)
      this.handleError(new DeviceError('could not derive addresses, reconnect your Trezor', 'DERIVATION_FAILURE'))
    }
  }

  async signMessage (index: number, rawMessage: string, cb: Callback<string>) {
    try {
      if (!this.device) {
        throw new Error('Trezor is not connected')
      }

      const message = this.normalize(rawMessage)
      const signature = await TrezorBridge.signMessage(this.device, this.getPath(index), message)
      
      cb(null, addHexPrefix(signature))
    } catch (e: unknown) {
      const err = e as DeviceError
      cb(new Error(err.message))
    }
  }

  async signTypedData (index: number, version: string, typedData: TypedData, cb: Callback<string>) {
    const versionNum = (version.match(/[Vv](\d+)/) || [])[1]

    if ((parseInt(versionNum) || 0) < 4) {
      return cb(new Error(`Invalid version (${version}), Trezor only supports eth_signTypedData version 4+`), undefined)
    }

    try {
      if (!this.device) {
        throw new Error('Trezor is not connected')
      }

      let signature
      const path = this.getPath(index)

      if (this.isTrezorOne()) {
        // Trezor One requires hashed input
        const { types, primaryType, domain, message } = TypedDataUtils.sanitizeData(typedData)
        const domainSeparatorHash = TypedDataUtils.hashStruct('EIP712Domain', domain, types, true).toString('hex')
        const messageHash = TypedDataUtils.hashStruct(primaryType as any, message, types, true).toString('hex')
  
        signature = await TrezorBridge.signTypedHash(this.device, path, typedData, domainSeparatorHash, messageHash)
      } else {
        signature = await TrezorBridge.signTypedData(this.device, path, typedData)
      }

      cb(null, addHexPrefix(signature))
    } catch (e: unknown) {
      const err = e as DeviceError
      cb(new Error(err.message))
    }
  }

  async signTransaction (index: number, rawTx: TransactionData, cb: Callback<string>) {
    try {
      const compatibility = signerCompatibility(rawTx, this.summary())
      const compatibleTx = compatibility.compatible ? { ...rawTx } : londonToLegacy(rawTx)

      const signedTx = await sign(compatibleTx, async (tx: TransactionData) => {
        if (!this.device) {
          throw new Error('Trezor is not connected')
        }
            
        const trezorTx = this.normalizeTransaction(tx)
        const path = this.getPath(index)

        try {
          return await TrezorBridge.signTransaction(this.device, path, trezorTx)
        } catch (e: unknown) {
          const err = e as DeviceError
          const errMsg = err.message.toLowerCase().match(/forbidden key path/)
            ? `Turn off strict Trezor safety checks in order to use the ${this.derivation} derivation path on this chain`
            : err.message

          throw(new Error(errMsg))
        }
      })

      cb(null, signedTx)
    } catch (e: unknown) {
      const err = e as DeviceError
      cb(err)
    }
  }

  private isTrezorOne () {
    return this.model.toLowerCase().includes('one')
  }

  private normalize (hex: string) {
    return (hex && padToEven(stripHexPrefix(hex))) || ''
  }

  private normalizeTransaction (tx: TransactionData) {
    const {nonce, gasLimit, to, value, data, chainId} = tx
    const unsignedTx = {
      nonce: this.normalize(nonce || ''),
      gasLimit: this.normalize(gasLimit || ''),
      to: this.normalize(to || ''),
      value: this.normalize(value || ''),
      data: this.normalize(data || ''),
      chainId: hexToInt(chainId)
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
