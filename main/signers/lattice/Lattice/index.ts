import { Client, DerivationOptions } from 'gridplus-sdk'
import { promisify } from 'util'
import log from 'electron-log'
import crypto from 'crypto'

import Signer from '../../Signer'

const ADDRESS_LIMIT = 10
const HARDENED_OFFSET = 0x80000000

export const Status = {
  INITIAL: 'loading',
  OK: 'ok',
  CONNECTING: 'connecting',
  DERIVING: 'Deriving addresses',
  READY_FOR_PAIRING: 'pair',
  PAIRING: 'Pairing',
  WRONG_APP: 'Open your Ledger and select the Ethereum application',
  DISCONNECTED: 'Disconnected',
  NEEDS_RECONNECTION: 'Please reload this Lattice1 device'
}

export default class Lattice extends Signer {
  deviceId: string;
  connection: Client | null = null;

  accountLimit = 5;

  constructor (deviceId: string) {
    super()

    this.id = 'lattice-' + deviceId
    this.deviceId = deviceId
    this.status = Status.INITIAL
    this.type = 'lattice'
    this.model = 'Lattice1'
  }

  connect (name: string, baseUrl: string, privateKey: string) {
    this.status = Status.CONNECTING
    this.emit('update')

    log.debug('connecting to Lattice', { name, baseUrl, privateKey })

    this.connection = new Client({
      name, baseUrl, privKey: privateKey, crypto
    })

    this.connection.connect(this.deviceId, (err, paired) => {
      if (err) return this.handleError('could not connect to Lattice', err)

      const [patch, minor, major] = this.connection?.fwVersion || [0, 0, 0]

      log.debug(`Connected to Lattice with deviceId=${this.deviceId}, firmware v${major}.${minor}.${patch}`)

      this.appVersion = { major, minor, patch }

      if (!paired) {
        this.status = Status.READY_FOR_PAIRING
        this.emit('update')
      }

      this.emit('connect', paired)
    })
  }

  disconnect () {
    this.connection = null
    this.addresses = []
  }

  close () {
    this.disconnect()
    
    this.emit('close')
    this.removeAllListeners()
    
    super.close()
  }

  pair (pairingCode: string) {
    if (!this.connection) {
      throw new Error('attempted to pair to disconnected Lattice')
    }

    log.debug('pairing to Lattice with code', pairingCode)

    this.status = Status.PAIRING
    this.emit('update')

    this.connection.pair(pairingCode, (err, hasActiveWallet) => {
      if (err) return this.handleError('could not pair to Lattice', err)

      this.emit('paired', hasActiveWallet)
    })
  }

  async deriveAddresses (retriesRemaining = 2) {
    try {
      if (!this.connection) throw new Error('attempted to derive addresses for disconnected Lattice')

      this.status = Status.DERIVING
      this.emit('update')

      log.debug(`deriving addresses for Lattice ${this.connection.name}`)

      const getAddresses = promisify<DerivationOptions, Array<string>>(this.connection.getAddresses).bind(this.connection)

      while (this.addresses.length < this.accountLimit) {
        const req = {
          startPath: this.getPath(this.addresses.length),
          n: Math.min(ADDRESS_LIMIT, this.accountLimit - this.addresses.length),
          skipCache: true
        }

        const loadedAddresses = await getAddresses(req)
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

  private getPath (index: number) {
    return [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, index]
  }

  private handleError (message: string, err: any) {
    log.error(message, err)

    this.disconnect()

    this.status = Status.NEEDS_RECONNECTION
    this.emit('update')
  }
}
