import { Client, DerivationOptions } from 'gridplus-sdk'
import { promisify } from 'util'
import log from 'electron-log'
import crypto from 'crypto'

import Signer from '../../Signer'

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
  UNKNOWN_ERROR: 'Unknown Error',
  DISCONNECTED: 'Disconnected',
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
      
      throw new Error(errorMessage)
    }
  }

  async deriveAddresses (retriesRemaining = 2) {
    try {
      if (!this.connection) throw new Error('attempted to derive addresses for disconnected Lattice')

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
    } catch (err) {
      if (err === 'Error from device: Invalid Request') log.warn('Lattice: Invalid Request')
      if (err === 'Error from device: Device Busy') log.warn('Lattice: Device Busy')
      else log.error(err)

      if (retriesRemaining > 0) {
        this.status = 'loading'

        setTimeout(() => {
          this.status = 'addresses'
          this.update()

          this.deriveAddresses(retriesRemaining - 1)
        }, 5000)
      } else {
        this.status = 'Error connecting'
      }

      this.update()

      return []
    }
  }

  summary () {
    const summary = super.summary()

    return {
      ...summary,
      addresses: this.addresses.slice(0, this.accountLimit || this.addresses.length)
    }
  }

  private getPath (index: number) {
    return [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, index]
  }

  private handleError (message: string, err: string) {
    const status = getStatusForError(err)
    const parsedErrorMessage = parseError(err)
    const fullMessage = message + ': ' + parsedErrorMessage

    log.error(fullMessage)

    this.status = status
    this.emit('error')

    return fullMessage
  }
}
