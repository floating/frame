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
import LedgerEthereumApp, { Derivation } from './eth'
import { threadId } from 'worker_threads'

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

const STATUS = {
  OK: 'ok',
  LOADING: 'loading',
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

  private derivation: Derivation;
  private accountLimit = 5;

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

  async open () {
    const transport = await TransportNodeHid.open(this.devicePath)

    this.eth = new LedgerEthereumApp(transport)
    this.requestQueue.start()
  }

  async connect () {

    try {
      // this check needs to start before we try to connect so that it can
      // keep checking if the device is already locked
      clearInterval(this.ethAppPoller)
      this.checkEthAppIsOpen(4000)

      const config = await this.eth.getAppConfiguration()
      const [major, minor, patch] = (config.version || '1.6.1').split('.')
      const version = { major, minor, patch }
      
      this.appVersion = version

      this.deriveAddresses()
    } catch (err) {
      this.handleError(err)

      if (this.status !== STATUS.LOCKED) {
        this.close()
      }
    }

    return this.eth
  }

  close () {
    this.requestQueue.close()

    clearTimeout(this.ethAppPoller)

    if (this.eth && this.status === STATUS.OK) {
      this.eth.close()
      this.eth = null
    }

    this.emit('close')
    this.removeAllListeners()
    
    super.close()
  }

  enqueueRequests (...requests: Request[]) {
    requests.forEach(req => this.requestQueue.add(req))
  }

  updateStatus (status: string) {
    this.status = status

    if (this.status === STATUS.OK) {
      clearInterval(this.ethAppPoller)
      this.checkEthAppIsOpen(4000)
    }

    if (this.status === STATUS.LOCKED) {
      clearInterval(this.ethAppPoller)
      this.checkEthAppIsOpen(1500)
    }
  }

  handleError (err) {
    if (isDeviceAsleep(err) && this.status !== STATUS.LOCKED) {
      this.updateStatus(STATUS.LOCKED)

      this.emit('lock')
    } else {
      this.updateStatus(getStatusForError(err))

      this.emit('update')

      if (this.status === STATUS.NEEDS_RECONNECTION) {
        this.close()
      }
    }
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

  async checkEthAppIsOpen (frequency: number) {

    const lastStatus = this.status

    this.ethAppPoller = setTimeout(() => {
      const lastRequest = this.requestQueue.peekBack()

      // prevent spamming eth app checks
      if (!lastRequest || lastRequest.type !== 'checkEthApp') {
        this.enqueueRequests({
          type: 'checkEthApp',
          execute: () => {
            if (lastStatus !== this.status) {
              // check if the status changed since this event was enqueued, this
              // will prevent unintended status transitions
              return Promise.resolve()
            }

            return this.eth.getAddress("44'/60'/0'/0", false, false)
              .then(() => {
                if (this.status === STATUS.LOCKED) {
                  this.updateStatus(STATUS.OK)
        
                  this.emit('unlock')
                }
              })
              .catch(err => {
                this.handleError(err)
              })
          }
        })
      }

      this.checkEthAppIsOpen(frequency)
    }, frequency)
  }

  deriveAddresses () {
    this.requestQueue.clear()
    this.addresses = []

    this.updateStatus(STATUS.DERIVING)
    this.emit('update')

    if (this.derivation === Derivation.live) {
      this._deriveLiveAddresses()
    } else {
      this._deriveHardwareAddresses()
    }
  }

  _deriveLiveAddresses () {
    const requests = []

    for (let i = 0; i < this.accountLimit; i++) {
      requests.push({
        type: 'deriveAddresses',
        execute: async () => {
          try {
            const path = this.eth.getPath(this.derivation, i)
            const { address } = await this.eth.getAddress(path, false, false)

            log.debug(`Found Ledger Live address #${i}: ${address}`)

            if (this.derivation === Derivation.live) {
              // don't update if the derivation was changed while this request was running
              if (this.status === STATUS.DERIVING) {
                this.updateStatus(STATUS.OK)
              }

              this.addresses = [...this.addresses, address]

              this.emit('update')
            }
          } catch (e) {
            this.handleError(e)
          }
        }
      })
    }

    this.enqueueRequests(...requests)
  }

  _deriveHardwareAddresses () {
    const targetDerivation = this.derivation

    this.enqueueRequests({
      type: 'deriveAddresses',
      execute: async () => {
        try {
          const addresses = await this.eth.deriveAddresses(this.derivation)

          if (this.derivation === targetDerivation) {
            // don't update if the derivation was changed while this request was running
            if (this.status === STATUS.DERIVING) {
              this.updateStatus(STATUS.OK)
            }

            this.addresses = [...addresses]

            this.emit('update')
          }
        } catch (e) {
          this.handleError(e)
        }
      }
    })
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
}
