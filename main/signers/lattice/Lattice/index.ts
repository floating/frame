import log from 'electron-log'
import { encode } from 'rlp'
import { Client, Utils, Constants } from 'gridplus-sdk'
import { padToEven, addHexPrefix } from '@ethereumjs/util'
import { TypedTransaction } from '@ethereumjs/tx'
import { SignTypedDataVersion } from '@metamask/eth-sig-util'

import Signer from '../../Signer'
import { sign, signerCompatibility, londonToLegacy } from '../../../transaction'
import { Derivation, getDerivationPath } from '../../Signer/derive'
import { hexToInt } from '../../../../resources/utils'

import type { TypedData, TypedMessage } from '../../../accounts/types'
import type { TransactionData } from '../../../../resources/domain/transaction'

const ADDRESS_LIMIT = 10
const HARDENED_OFFSET = 0x80000000

interface DeriveOptions {
  retries: number,
  derivation?: Derivation
}

interface Signature {
  r: Buffer,
  s: Buffer,
  v: Buffer
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

function parseError (err: Error) {
  return (err.message || '').replace(/Error from device: /, '')
}

function getStatusForError (err: Error) {
  const errText = (err.message || '').toLowerCase()

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

  constructor (deviceId: string, name: string, tag: string) {
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
      const errorMessage = this.handleError('could not connect to Lattice', e as Error)

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
      const errorMessage = this.handleError('could not pair to Lattice', e as Error)

      this.emit('error')

      throw new Error(errorMessage)
    }
  }

  async deriveAddresses (derivation?: Derivation, retries = 2) {
    this.status = Status.DERIVING
    this.emit('update')

    log.info(`deriving addresses for Lattice ${(this.connection as Client).getAppName()}`)

    try {
      await this.derive({ derivation, retries })
    } catch (e) {
      this.emit('error', e)
    }
  }

  private async derive (opts: DeriveOptions) {
    const { derivation, retries } = opts

    try {
      this.derivation = derivation || this.derivation

      const connection = this.connection as Client

      const addressLimit = this.derivation === Derivation.live ? 1 : ADDRESS_LIMIT

      while (this.addresses.length < this.accountLimit) {
        const req = {
          startPath: this.getPath(this.addresses.length),
          n: Math.min(addressLimit, this.accountLimit - this.addresses.length),
        }

        const loadedAddresses = await connection.getAddresses(req)
        this.addresses = [...this.addresses, ...loadedAddresses].map((addr) =>
           addHexPrefix(addr.toString())
        )
      }

      this.status = 'ok'
      this.emit('update')

      return this.addresses
    } catch (e) {
      const err = e as Error

      if (retries > 0) {
        log.verbose(`Deriving ${this.derivation} Lattice addresses failed, trying ${retries} more times, error:`, err.message)

        return new Promise<string[]>(resolve => {
          setTimeout(() => {
            resolve(this.derive({ ...opts, retries: retries - 1 }))
          }, 3000)
        })
      }

      const errorMessage = this.handleError('could not derive addresses', err)

      throw new Error(errorMessage)
    }
  }

  async verifyAddress (index: number, currentAddress: string, display = true, cb: Callback<boolean>) {
    const connection = this.connection as Client

    log.info(`verifying address ${currentAddress} for Lattice ${connection.getAppName()}`)

    try {
      const addresses = await this.derive({ retries: 0 })

      const address = (addresses[index] || '').toLowerCase()

      if (address !== currentAddress) {
        throw new Error('Address does not match device')
      }

      log.info(`address ${currentAddress} matches device`)

      cb(null, true)
    } catch (e) {
      const err = e as Error

      this.handleError('could not verify address', err)
      this.emit('error')

      cb(err.message === 'Address does not match device' ? err : new Error('Verify Address Error'))
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

  async signTypedData (index: number, typedMessage: TypedMessage<SignTypedDataVersion.V4>, cb: Callback<string>) {
    try {
      const signature = await this.sign(index, 'eip712', typedMessage.data)

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

      const signedTx = await sign(latticeTx, async tx => {
        const unsignedTx = this.createTransaction(index, rawTx.type, latticeTx.chainId, tx)
        const signingOptions = await this.createTransactionSigningOptions(tx, unsignedTx)

        const signedTx = await connection.sign(signingOptions)
        const sig = signedTx?.sig as Signature

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
    const sig = result?.sig as Signature

    const signature = [
      sig.r,
      sig.s,
      padToEven(sig.v.toString('hex'))
    ].join('')

    return addHexPrefix(signature)
  }

  private createTransaction (index: number, txType: string, chainId: string, tx: TypedTransaction) {
    const { value, to, data, ...txJson } = tx.toJSON()
    const type = hexToInt(txType)

    const unsignedTx: any = {
      to,
      value,
      data,
      chainId,
      nonce: hexToInt(txJson.nonce || ''),
      gasLimit: hexToInt(txJson.gasLimit || ''),
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
        unsignedTx[field] = hexToInt(txJson[field])
      }
    })

    return unsignedTx
  }

  private async createTransactionSigningOptions (tx: TypedTransaction, unsignedTx: any) {
    const fwVersion = (this.connection as Client).getFwVersion()

    if (fwVersion && (fwVersion.major > 0 || fwVersion.minor >= 15)) {
      const payload = tx.type ?
        tx.getMessageToSign(false) :
        encode(tx.getMessageToSign(false))

      const to = tx.to?.toString() ?? undefined

      const callDataDecoder = to
        ? await Utils.fetchCalldataDecoder(tx.data, to, unsignedTx.chainId)
        : undefined

      const data = {
        payload,
        curveType: Constants.SIGNING.CURVES.SECP256K1,
        hashType: Constants.SIGNING.HASHES.KECCAK256,
        encodingType: Constants.SIGNING.ENCODINGS.EVM,
        signerPath: unsignedTx.signerPath,
        decoder: callDataDecoder?.def
      }

      return { data, currency: unsignedTx.currency }
    }
      
    return { currency: 'ETH', data: unsignedTx }
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

  private handleError (message: string, err: Error) {
    const status = getStatusForError(err)
    const parsedErrorMessage = parseError(err)
    const fullMessage = message + ': ' + parsedErrorMessage

    log.error(fullMessage)

    this.status = status

    return fullMessage
  }
}
