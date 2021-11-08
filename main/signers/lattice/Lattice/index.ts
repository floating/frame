import { Client } from 'gridplus-sdk'
import type { SignedData, Signature } from 'gridplus-sdk'
import { promisify } from 'util'

import { padToEven, stripHexPrefix, addHexPrefix } from 'ethereumjs-util'
import log from 'electron-log'
import crypto from 'crypto'

import Signer from '../../Signer'
import { TransactionData } from '../../../transaction'

const ADDRESS_LIMIT = 10
const HARDENED_OFFSET = 0x80000000

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
  deviceId: string;
  connection: Client | null = null;

  accountLimit = 5;

  constructor (deviceId: string, name: string) {
    super()

    this.id = 'lattice-' + deviceId
    this.deviceId = deviceId
    this.name = name
    this.status = Status.DISCONNECTED
    this.type = 'lattice'
    this.model = 'Lattice1'
  }

  async connect (baseUrl: string, privateKey: string) {
    this.status = Status.CONNECTING
    this.emit('update')

    log.debug('connecting to Lattice', { name: this.name, baseUrl, privateKey })

    this.connection = new Client({
      name: this.name,
      baseUrl,
      privKey: privateKey,
      crypto,
      timeout: 30000
    })

    try {
      const connect = promisify(this.connection.connect).bind(this.connection, this.deviceId)
      const paired = !!(await connect())

      const [patch, minor, major] = this.connection?.fwVersion || [0, 0, 0]

      log.debug(`Connected to Lattice with deviceId=${this.deviceId}, firmware v${major}.${minor}.${patch}`)

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
    if (!this.connection) {
      throw new Error('attempted to pair to disconnected Lattice')
    }

    log.debug(`pairing to Lattice ${this.deviceId} with code`, pairingCode)

    this.status = Status.PAIRING
    this.emit('update')

    try {
      const pair = promisify(this.connection.pair).bind(this.connection, pairingCode)
      const hasActiveWallet = !!(await pair())

      log.debug(`successfully paired to Lattice ${this.deviceId}`)

      this.emit('paired', hasActiveWallet)

      return hasActiveWallet
    } catch (e) {
      const errorMessage = this.handleError('could not pair to Lattice', e as string)

      this.emit('error')
      
      throw new Error(errorMessage)
    }
  }

  async deriveAddresses (retriesRemaining = 2) {
    if (!this.connection) {
      throw new Error('attempted to derive addresses for disconnected Lattice')
    }

    try {
      this.status = Status.DERIVING
      this.emit('update')

      log.debug(`deriving addresses for Lattice ${this.connection.name}`)

      const getAddresses = promisify(this.connection.getAddresses).bind(this.connection)

      while (this.addresses.length < this.accountLimit) {
        const req = {
          startPath: this.getPath(this.addresses.length),
          n: Math.min(ADDRESS_LIMIT, this.accountLimit - this.addresses.length),
          skipCache: true
        }

        const loadedAddresses = (await getAddresses(req)) as string[]
        this.addresses = [...this.addresses, ...loadedAddresses]
      }

      this.status = 'ok'
      this.emit('update')

      return this.addresses
    } catch (e) {
      if (retriesRemaining > 0) {
        return new Promise<string[]>(resolve => {
          setTimeout(() => {
            resolve(this.deriveAddresses(retriesRemaining - 1))
          }, 3000)
        })
      }
      
      const errorMessage = this.handleError('could not derive addresses', e as string)
      this.emit('error')

      throw new Error(errorMessage)
    }
  }

  async verifyAddress (index: number, currentAddress: string, display = true, cb: Callback<boolean>) {
    log.debug(`verifying address ${currentAddress} for Lattice ${this.connection?.name}`)

    try {
      const addresses = await this.deriveAddresses(0)
      
      const address = (addresses[index] || '').toLowerCase()

      if (address !== currentAddress) {
        throw new Error('Address does not match device')
      }

      log.debug(`address ${currentAddress} matches device`)
      cb(null, true)
    } catch (e) {
      const err = (e as Error).message

      this.handleError('could not verify address', err)
      this.emit('error')
      
      cb(new Error(err === 'Address does not match device' ? err : 'Verify Address Error'), undefined)
    }
  }

  async signMessage (index: number, message: string, cb: Callback<string>) {
    try {
      const signature = await this.sign(index, 'signPersonal', message)

      return cb(null, signature)
    } catch (err) {
      return cb(new Error(err as string), undefined)
    }
  }

  async signTypedData (index: number, version: string, typedData: any, cb: Callback<string>) {
    
  }

  async signTransaction (index: number, rawTx: TransactionData, cb: Callback<string>) {
  }

  summary () {
    const summary = super.summary()

    return {
      ...summary,
      addresses: this.addresses.slice(0, this.accountLimit || this.addresses.length)
    }
  }

  private async sign (index: number, protocol: string, payload: string) {
    const clientSign = promisify((this.connection as Client).sign).bind(this.connection)

    const data = {
      protocol,
      payload,
      signerPath: this.getPath(index)
    }

    const signOpts = {
      currency: 'ETH_MSG',
      data: data
    }

    const result = (await clientSign(signOpts)) as SignedData
    const sig = result.sig as Signature

    const signature = [
      sig.r,
      sig.s,
      padToEven(sig.v.toString('hex'))
    ].join('')

    return addHexPrefix(signature)
  }

  private getPath (index: number) {
    return [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, index]
  }

  private normalize (hex: string ) {
    return (hex && padToEven(stripHexPrefix(hex))) || ''
  }

  private hexToBuffer (hex: string) {
    return Buffer.from(this.normalize(hex), 'hex')
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
