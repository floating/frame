import { Client, Utils } from 'gridplus-sdk'
import { padToEven, addHexPrefix } from 'ethereumjs-util'
import { hexToNumber } from 'web3-utils'
import log from 'electron-log'
import crypto from 'crypto'

import Signer from '../../Signer'
import { sign, signerCompatibility, londonToLegacy, Signature } from '../../../transaction'
import type { TransactionData } from '../../../transaction'
import { TypedTransaction } from '@ethereumjs/tx'
import { Derivation, getDerivationPath } from '../../Signer/derive'
import { TypedData } from 'eth-sig-util'

const ADDRESS_LIMIT = 10
const HARDENED_OFFSET = 0x80000000

interface DeriveOptions {
  retries?: number,
  derivation?: Derivation
}

export const Status = {
  OK: 'ok',
  CONNECTING: 'connecting',
  DERIVING: 'addresses',
  READY_FOR_PAIRING: 'pair',
  LOCKED: 'locked',
  PAIRING: 'Pairing',
  PAIRING_FAILED: 'Pairing Failed',
  UNKNOWN_ERROR: 'Unknown Device Error',
  DISCONNECTED: 'disconnected',
  NEEDS_RECONNECTION: 'Please reload this Lattice1 device'
}

function devicePermission (tag: string) {
  return tag ? `Frame-${tag}` : 'Frame'
}

function parseError (err: string) {
  return err.replace(/Error from device: /, '')
}

function getStatusForError (err: string) {
  const errText = err.toLowerCase()

  if (errText.includes('device locked')) {
    return Status.LOCKED
  }

  if (errText.includes('pairing failed')) {
    return Status.PAIRING_FAILED
  }

  return Status.UNKNOWN_ERROR
}

export default class Lattice extends Signer {
  deviceId: string
  derivation: Derivation | undefined
  connection: Client | null = null

  accountLimit = 5
  tag = ''

  constructor(deviceId: string, name: string, tag: string) {
    super()

    this.id = 'lattice-' + deviceId
    this.deviceId = deviceId
    this.name = name
    this.tag = tag
    this.status = Status.DISCONNECTED
    this.type = 'lattice'
    this.model = 'Lattice1'
  }

  async connect (baseUrl: string, privateKey: string) {
    this.status = Status.CONNECTING
    this.emit('update')

    log.info('connecting to Lattice', { name: this.name, baseUrl })

    this.connection = new Client({
      name: devicePermission(this.tag),
      baseUrl,
      privKey: privateKey,
      skipRetryOnWrongWallet: false,
    })

    try {
      const paired = await this.connection.connect(this.deviceId)

      const { fix: patch, minor, major } = this.connection.getFwVersion() || { fix: 0, major: 0, minor: 0 }

      log.info(`Connected to Lattice with deviceId=${this.deviceId} paired=${paired}, firmware v${major}.${minor}.${patch}`)

      this.appVersion = { major, minor, patch }

      if (!paired) {
        this.status = Status.READY_FOR_PAIRING
        this.emit('update')
      }

      this.emit('connect', paired)

      return paired
    } catch (e) {
      const errorMessage = this.handleError('could not connect to Lattice', e as string)

      this.emit('error')

      throw new Error(errorMessage)
    }
  }

  disconnect () {
    if (this.status === Status.OK) {
      this.status = Status.DISCONNECTED
      this.emit('update')
    }

    this.connection = null

    this.addresses = []
  }

  close () {
    this.emit('close')
    this.removeAllListeners()

    this.disconnect()

    super.close()
  }

  async pair (pairingCode: string) {
    log.info(`pairing to Lattice ${this.deviceId} with code`, pairingCode)

    this.status = Status.PAIRING
    this.emit('update')

    try {
      const connection = this.connection as Client
      const hasActiveWallet = await connection.pair(pairingCode)

      log.info(`successfully paired to Lattice ${this.deviceId}`)

      this.emit('paired', hasActiveWallet)

      return hasActiveWallet
    } catch (e) {
      const errorMessage = this.handleError('could not pair to Lattice', e as string)

      this.emit('error')

      throw new Error(errorMessage)
    }
  }

  async deriveAddresses (opts?: DeriveOptions) {
    const { derivation, retriesRemaining } = {
      derivation: opts?.derivation || this.derivation,
      retriesRemaining: ((opts && ('retries' in opts)) ? opts.retries : 2) as number
    }

    try {
      this.status = Status.DERIVING
      this.emit('update')

      this.derivation = derivation

      const connection = this.connection as Client

      log.info(`deriving addresses for Lattice ${connection.getAppName()}`)

      const addressLimit = derivation === Derivation.live ? 1 : ADDRESS_LIMIT

      while (this.addresses.length < this.accountLimit) {
        const req = {
          startPath: this.getPath(this.addresses.length),
          n: Math.min(addressLimit, this.accountLimit - this.addresses.length),
          flag: 1,
        }

        const loadedAddresses = await connection.getAddresses(req)
        this.addresses = [...this.addresses, ...loadedAddresses].map((addr) =>
          addr.toString()
        );
      }

      this.status = 'ok'
      this.emit('update')

      return this.addresses
    } catch (e) {
      if (retriesRemaining > 0) {
        return new Promise<string[]>(resolve => {
          setTimeout(() => {
            resolve(this.deriveAddresses({ retries: retriesRemaining - 1 }))
          }, 3000)
        })
      }

      const errorMessage = this.handleError('could not derive addresses', e as string)
      this.emit('error')

      throw new Error(errorMessage)
    }
  }

  async verifyAddress (index: number, currentAddress: string, display = true, cb: Callback<boolean>) {
    const connection = this.connection as Client

    log.info(`verifying address ${currentAddress} for Lattice ${connection.getAppName()}`)

    try {
      const addresses = await this.deriveAddresses({ retries: 0 })

      const address = (addresses[index] || '').toLowerCase()

      if (address !== currentAddress) {
        throw new Error('Address does not match device')
      }

      log.info(`address ${currentAddress} matches device`)

      cb(null, true)
    } catch (e) {
      const err = (e as Error).message

      this.handleError('could not verify address', err)
      this.emit('error')

      cb(new Error(err === 'Address does not match device' ? err : 'Verify Address Error'))
    }
  }

  async signMessage (index: number, message: string, cb: Callback<string>) {
    try {
      const signature = await this.sign(index, 'signPersonal', message)

      return cb(null, signature)
    } catch (err) {
      log.error('failed to sign message with Lattice', err)
      return cb(new Error(err as string))
    }
  }

  async signTypedData (index: number, version: string, typedData: TypedData, cb: Callback<string>) {
    const versionNum = (version.match(/[Vv](\d+)/) || [])[1]

    if ((parseInt(versionNum) || 0) < 4) {
      return cb(new Error(`Invalid version (${version}), Lattice only supports eth_signTypedData version 4+`))
    }

    try {
      const signature = await this.sign(index, 'eip712', typedData)

      return cb(null, signature)
    } catch (err) {
      log.error('failed to sign typed data with Lattice', err)
      return cb(new Error(err as string))
    }
  }

  async signTransaction (index: number, rawTx: TransactionData, cb: Callback<string>) {
    try {
      const connection = this.connection as Client
      const compatibility = signerCompatibility(rawTx, this.summary())
      const latticeTx = compatibility.compatible ? { ...rawTx } : londonToLegacy(rawTx)

      const signedTx: any = await sign(latticeTx, async tx => {
        const unsignedTx = this.createTransaction(index, rawTx.type, latticeTx.chainId, tx)
        const signOpts = { currency: 'ETH', data: unsignedTx }

        const result = await connection.sign(signOpts)
        const sig = result?.sig

        if (!sig) {
          throw new Error('Signing failed')
        }

        return {
          v: sig.v.toString('hex'),
          r: sig.r.toString('hex'),
          s: sig.s.toString('hex')
        }
      })

      cb(null, addHexPrefix(signedTx.serialize().toString('hex')))
    } catch (err) {
      log.error('error signing transaction with Lattice', err)
      return cb(new Error(err as string))
    }
  }

  summary () {
    const summary = super.summary()

    return {
      ...summary,
      tag: this.tag,
      addresses: this.addresses.slice(0, this.accountLimit || this.addresses.length)
    }
  }

  private async sign (index: number, protocol: string, payload: string | TypedData) {
    const connection = this.connection as Client

    const data = {
      protocol,
      payload,
      signerPath: this.getPath(index)
    }

    const signOpts = {
      currency: 'ETH_MSG',
      data: data
    }

    const result = await connection.sign(signOpts)
    const sig = result?.sig

    if (!sig) {
      throw new Error('Signing failed')
    }

    const signature = [
      sig.r,
      sig.s,
    ].join('')

    return addHexPrefix(signature)
  }

  private createTransaction (index: number, txType: string, chainId: string, tx: TypedTransaction) {
    const { value, to, data, ...txJson } = tx.toJSON()
    const type = hexToNumber(txType)

    const unsignedTx: any = {
      to,
      value,
      data,
      chainId,
      nonce: hexToNumber(txJson.nonce || ''),
      gasLimit: hexToNumber(txJson.gasLimit || ''),
      useEIP155: true,
      signerPath: this.getPath(index)
    }

    if (type) {
      unsignedTx.type = type
    }

    const optionalFields = ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']

    optionalFields.forEach(field => {
      if (field in txJson) {
        // @ts-ignore
        unsignedTx[field] = hexToNumber(txJson[field])
      }
    })

    return unsignedTx
  }

  private getPath (index: number) {
    if (!this.derivation) {
      throw new Error('attempted to get base path with unknown derivation!')
    }

    const path = getDerivationPath(this.derivation, index)

    return path.split('/').map(element => {
      if (element.endsWith("'")) {
        return parseInt(element.substring(0, element.length - 1)) + HARDENED_OFFSET
      }

      return parseInt(element)
    })
  }

  private handleError (message: string, err: string) {
    const status = getStatusForError(err)
    const parsedErrorMessage = parseError(err)
    const fullMessage = message + ': ' + parsedErrorMessage

    log.error(fullMessage)

    this.status = status

    return fullMessage
  }
}
