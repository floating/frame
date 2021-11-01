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
  DERIVING: 'addresses',
  PAIRING: 'pair',
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

  async connect (name: string, baseUrl: string, privateKey: string) {
    this.status = Status.CONNECTING
    this.emit('update')

    console.log({ Client })
    this.connection = new Client({
      name, baseUrl, privKey: privateKey, crypto
    })

    try {
      const clientConnect = promisify<string, boolean>(this.connection.connect).bind(this.connection)

      const paired = await clientConnect(this.deviceId)

      const [patch, minor, major] = this.connection.fwVersion || [0, 0, 0]

      log.debug(`Connected to Lattice with deviceId=${this.deviceId}, firmware v${major}.${minor}.${patch}`)

      this.appVersion = { major, minor, patch }

      if (paired) {
        // Lattice recognizes the private key and remembers if this
        // client is already paired between sessions
        await this.deriveAddresses()
      } else {
        this.status = Status.PAIRING
        this.emit('update')
      }
    } catch (e) {
      log.error('could not connect to Lattice', e)

      this.status = Status.DISCONNECTED
      this.emit('update')
    }
  }

  disconnect () {
    this.connection = null
  }

  close () {
    this.emit('close')
    this.removeAllListeners()
    
    super.close()
  }

  async pair (pairingCode: string) {
    log.debug('pairing to Lattice with code', pairingCode)

    if (!this.connection) {
      throw new Error('attempted to pair to disconnected Lattice')
    }

    try {
      const clientPair = promisify<string, boolean>(this.connection.pair).bind(this.connection)
      const hasActiveWallet = await clientPair(pairingCode)

      if (hasActiveWallet) {
        await this.deriveAddresses()
      }
    } catch (e) { 
      this.status = Status.NEEDS_RECONNECTION
      this.emit('update')
    }
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
}
