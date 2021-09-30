// @ts-nocheck
import log from 'electron-log'
import { rlp, addHexPrefix } from 'ethereumjs-util'
import { v5 as uuid } from 'uuid'

import HID from 'node-hid'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import Eth from '@ledgerhq/hw-app-eth'

import { Request, RequestQueue } from './requestQueue'
import Signer from '../../Signer'
import { sign, signerCompatibility, londonToLegacy } from '../../../transaction'
import { request } from 'http'
import LedgerEthereumApp from './eth'
import { threadId } from 'worker_threads'

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

const STATUS = {
  OK: 'ok',
  DERIVING: 'Deriving addresses',
  LOCKED: 'Please unlock your ledger',
  WRONG_APP: 'Open your Ledger and select the Ethereum application',
  DISCONNECTED: 'Disconnected',
  NEEDS_RECONNECTION: 'Please reconnect this Ledger device'
}

function isDeviceAsleep (err: { statusCode: number }) {
  return [27404].includes(err.statusCode)
}

function needToOpenEthApp (err: { statusCode: number }) {
  return [27904, 27906, 25873, 25871].includes(err.statusCode)
}

function getStatusForError (err: { statusCode: number }) {
  if (needToOpenEthApp(err)) {
    return STATUS.WRONG_APP
  }
  
  if (isDeviceAsleep(err)) {
    return STATUS.LOCKED
  }

  return STATUS.NEEDS_RECONNECTION
}


export default class Ledger extends Signer {
  private eth: LedgerEthereumApp | undefined;
  private devicePath: string;

  // the Ledger device can only handle one request at a time; the transport will reject
  // all incoming requests while its busy, so we need to make sure requests are only executed
  // when the device is ready
  private requestQueue = new RequestQueue()
  private ethAppPoller: NodeJS.Timeout

  private coinbase = '0x'

  constructor (devicePath: string) {
    super()

    this.devicePath = devicePath

    this.addresses = []

    this.id = uuid('Ledger' + this.devicePath, ns)
    this.type = 'ledger'
    this.status = 'initial'
  }

  async connect () {
    const transport = await TransportNodeHid.open(this.devicePath)

    this.eth = new LedgerEthereumApp(transport)

    console.log('WE HAVE AN APP')

    try {
      const config = await this.eth.getAppConfiguration()
      
      const [major, minor, patch] = (config.version || '1.6.1').split('.')
      const version = { major, minor, patch }
      this.appVersion = version
    } catch (err) {
      this.eth = undefined
      this.handleError(err)
    }

    return this.eth
  }

  async open () {
    console.log('OPENING')
    this.requestQueue.start()
console.log('CONNECTING')

    await this.connect()

    console.log('CHECKING')

    this.checkEthAppIsOpen()

    return this.eth
  }

  close () {
    this.requestQueue.close()

    clearTimeout(this.ethAppPoller)

    if (this.eth) {
      this.status = STATUS.DISCONNECTED
      this.eth.close()
      this.eth = null
    }

    this.emit('close')
    this.removeAllListeners()
    
    super.close()
  }

  enqueueRequest (request: Request) {
    this.requestQueue.add(request)
  }

  async checkEthAppIsOpen () {
    const timeout = this.status === STATUS.LOCKED ? 500 : 4000

    this.ethAppPoller = setTimeout(() => {
      const lastRequest = this.requestQueue.peekBack()

      // prevent spamming eth app checks
      if (!lastRequest || lastRequest.type !== 'checkEthApp') {
        this.enqueueRequest({
          type: 'checkEthApp',
          execute: async () => {
            console.log(' -----> CHECKING ETH APP ', { status: this.status })
            try {
              await this.eth.getAddress("44'/60'/0'/0", false, false)

              if (this.status === STATUS.LOCKED) {
                this.status = STATUS.OK
      
                this.emit('unlock')
              }
            } catch (err) {
              console.log('NO ETH APP')
              if (isDeviceAsleep(err) && this.status !== STATUS.LOCKED) {
                console.log('ASLEEP')
                this.status = STATUS.LOCKED
      
                this.emit('lock')
              } else {
                this.handleError(err)
              }
            }
          }
        })
      }

      this.checkEthAppIsOpen()
    }, timeout)
  }

  update () {
    if (this.invalid || this.status === 'Invalid sequence' || this.status === 'initial') return
    store.updateSigner(this.summary())
  }

  handleError (err) {
    this.status = getStatusForError(err)

    console.log('UPDATED ERROR STATUS TO: ', this.status, err)
    this.emit('update')
  }

  updateStatus (status) {
    this.status = status

    this.emit('status', status)
  }

  async getDeviceAddress (i, cb = () => {}) {
    if (this.pause) return cb(new Error('Device access is paused'))
    try {
      const { address } = await this.getAddress(this.getPath(i), false, true)
      cb(null, address)
    } catch (err) {
      cb(err)
    }
  }

  async verifyAddress (index, current, display, cb = () => {}) {
    if (this.verifyActive) {
      const message = "verifyAddress called but it's already active"

      log.info(message)
      return cb(new Error(message))
    }
    
    this.verifyActive = true

    try {
      const result = await this.getAddress(this.getPath(index), display, true)
      const address = result.address.toLowerCase()
      current = current.toLowerCase()
      if (address !== current) {
        log.error(new Error('Address does not match device'))
        this.signers.remove(this.id)
        cb(new Error('Address does not match device'))
      } else {
        log.info('Address matches device')
        cb(null, true)
      }
    } catch (err) {
      log.error('Verify Address Error')
      log.error(err)
      this.signers.remove(this.id)
      cb(new Error('Verify Address Error'))
    } finally {
      this.verifyActive = false
    }
  }

  deriveAddresses (accountLimit) {
    this.enqueueRequest({
      type: 'deriveAddresses',
      execute: async () => {
        console.log('DERIVING ADDRESSES')
        if (this.eth) {
          this.status = STATUS.DERIVING
          this.emit('update')

          return new Promise(resolve => {
            console.log({ eth: this.eth })
            const stream = this.eth.deriveAddresses(this.derivation, accountLimit)

            stream.on('addresses', derivedAddresses => {
              console.log('GOT SOME ADDRESSES')
              this.status = STATUS.OK
              this.addresses = [...this.addresses, ...derivedAddresses]
              this.emit('update')
            })

            stream.on('error', err => this.handleError(err))

            stream.on('close', resolve)
          })
        }
      }
    })
  }

  pollStatus (interval = 21 * 1000) { // Detect sleep/wake
    clearTimeout(this._pollStatus)
    this._pollStatus = setTimeout(() => this.deviceStatus(), interval)
  }

  async deviceStatus () {
    if (this.status === 'Invalid sequence') return log.warn('INVALID SEQUENCE')
    this.pollStatus()
    if (this.pause || this.deviceStatusActive || this.verifyActive) return
    this.deviceStatusActive = true
    try {
      // If signer has no addresses, try deriving them
      if (!this.addresses.length) await this.deriveAddresses()
      const { address } = await this.getAddress(this.getPath(0), false, true)
      if (address !== this.coinbase || this.status !== 'ok') {
        this.coinbase = address
        this.deviceStatus()
      }
      this.status = 'ok'

      if (!this.addresses.length) {
        this.status = 'loading'
        this.deriveAddresses()
      } else {
        this.busyCount = 0
      }
      this.update()
      this.deviceStatusActive = false
    } catch (err) {
      log.error(err)
      log.error(err.message)
      const deviceBusy = (
        err.message.startsWith('cannot open device with path') ||
        err.message === 'Device access is paused' ||
        err.message === 'Invalid channel' ||
        err.message === 'DisconnectedDevice'
      )
      if (deviceBusy) { // Device is busy, try again
        clearTimeout(this._deviceStatus)
        if (++this.busyCount > 10) {
          this.busyCount = 0
          log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
        } else {
          this._deviceStatus = setTimeout(() => this.deviceStatus(), 700)
          log.info('>>>>>>> Busy: cannot open device with path, will try again (deviceStatus)')
        }
      } else {
        this.status = err.message
        if (err.statusCode === 27904) this.status = 'Wrong application, select the Ethereum application on your Ledger'
        if (err.statusCode === 26368) this.status = 'Select the Ethereum application on your Ledger'
        if (err.statusCode === 26625 || err.statusCode === 26628) {
          this.pollStatus(3000)
          this.status = 'Confirm your Ledger is not asleep'
        }
        if (err.message === 'Cannot write to HID device') {
          this.status = 'loading'
          log.error('Device Status: Cannot write to HID device')
        }
        if (err.message === 'Invalid sequence') this.invalid = true
        if (err.message.indexOf('UNKNOWN_ERROR') > -1) this.status = 'Please reconnect this Ledger device'
        this.addresses = []
        this.update()
      }
      this.deviceStatusActive = false
    }
  }

  normalize (hex) {
    if (hex == null) return ''
    if (hex.startsWith('0x')) hex = hex.substring(2)
    if (hex.length % 2 !== 0) hex = '0' + hex
    return hex
  }

  // Standard Methods
  async signMessage (index, message, cb) {
    try {
      if (this.pause) throw new Error('Device access is paused')
      const eth = await this.getDevice()
      const result = await eth.signPersonalMessage(this.getPath(index), message.replace('0x', ''))
      let v = (result.v - 27).toString(16)
      if (v.length < 2) v = '0' + v
      cb(null, '0x' + result.r + result.s + v)
      await this.releaseDevice()
      this.busyCount = 0
    } catch (err) {
      const deviceBusy = (
        err.message.startsWith('cannot open device with path') ||
        err.message === 'Device access is paused' ||
        err.message === 'Invalid channel' ||
        err.message === 'DisconnectedDevice'
      )
      if (deviceBusy) {
        clearTimeout(this._signMessage)
        if (++this.busyCount > 20) {
          this.busyCount = 0
          return log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
        } else {
          this._signMessage = setTimeout(() => this.signMessage(index, message, cb), 700)
          return log.info('>>>>>>> Busy: cannot open device with path, will try again (signMessage)')
        }
      }
      cb(err)
      await this.releaseDevice()
      log.error(err)
    }
  }

  async signTransaction (index, rawTx, cb) {
    try {
      if (this.pause) throw new Error('Device access is paused')
      const eth = await this.getDevice()
      const signerPath = this.getPath(index)

      const compatibility = signerCompatibility(rawTx, this.summary())
      const ledgerTx = compatibility.compatible ? { ...rawTx } : londonToLegacy(rawTx)

      const signedTx = await sign(ledgerTx, tx => {
        // legacy transactions aren't RLP encoded before they're returned
        const message = tx.getMessageToSign(false)
        const legacyMessage = message[0] !== parseInt(tx.type)
        const rawTxHex = legacyMessage ? rlp.encode(message).toString('hex') : message.toString('hex')

        return eth.signTransaction(signerPath, rawTxHex)
      })

      const signedTxSerialized = signedTx.serialize().toString('hex')
      cb(null, addHexPrefix(signedTxSerialized))

      this.releaseDevice()
    } catch (err) {
      log.error(err)
      log.error(err.message)
      const deviceBusy = (
        err.message.startsWith('cannot open device with path') ||
        err.message === 'Device access is paused' ||
        err.message === 'Invalid channel' ||
        err.message === 'DisconnectedDevice'
      )
      if (deviceBusy) {
        clearTimeout(this._signTransaction)
        if (++this.busyCount > 20) {
          this.busyCount = 0
          cb(err)
          return log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
        } else {
          this._signTransaction = setTimeout(() => this.signTransaction(index, rawTx, cb), 700)
          return log.info('>>>>>>> Busy: cannot open device with path, will try again (signTransaction)')
        }
      } else {
        cb(err)
      }
      this.releaseDevice()
      log.error(err)
    }
  }

  async getAddress (...args) {
    return this.eth.getAddress(...args)
  }

  async _getAppConfiguration () {
    try {
      const eth = await this.getDevice()
      const result = await eth.getAppConfiguration()
      await this.releaseDevice()
      return result
    } catch (err) {
      await this.releaseDevice()
      throw err
    }
  }

  async _deriveLiveAddresses (accountLimit) {
    this.liveAddressesFound = 0

    for (let i = 0; i < accountLimit; i++) {
      const { address } = await this.getAddress(this.getPath(i), false, false)

      log.info(`Found Ledger Live address #${i}: ${address}`)

      this.addresses = [...this.addresses, address]
      this.liveAddressesFound = this.addresses.length

      this.emit('addresses', this.addresses)
    }
  }

  _deriveLegacyAddresses () {
    const executor = async (resolve, reject) => {
      try {
        const result = await this.getAddress(BASE_PATH_LEGACY, false, true)
        this.deriveHDAccounts(result.publicKey, result.chainCode, (err, addresses) => {
          if (err) reject(err)
          else resolve(addresses)
        })
      } catch (err) {
        reject(err)
      }
    }
    return new Promise(executor)
  }

  _deriveStandardAddresses () {
    const executor = async (resolve, reject) => {
      try {
        const result = await this.getAddress(BASE_PATH_STANDARD, false, true)
        this.deriveHDAccounts(result.publicKey, result.chainCode, (err, addresses) => {
          if (err) reject(err)
          else resolve(addresses)
        })
      } catch (err) {
        reject(err)
      }
    }
    return new Promise(executor)
  }

  _deriveTestnetAddresses () {
    const executor = async (resolve, reject) => {
      try {
        const result = await this.getAddress(BASE_PATH_TESTNET, false, true)
        this.deriveHDAccounts(result.publicKey, result.chainCode, (err, addresses) => {
          if (err) reject(err)
          else resolve(addresses)
        })
      } catch (err) {
        reject(err)
      }
    }
    return new Promise(executor)
  }
}
