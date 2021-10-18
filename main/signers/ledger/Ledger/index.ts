import log from 'electron-log'

// @ts-ignore
import { v5 as uuid } from 'uuid'

import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'

import { Request, RequestQueue } from './requestQueue'
import Signer, { Callback } from '../../Signer'
import LedgerEthereumApp from './eth'
import { Derivation, getDerivationPath } from '../../Signer/derive'
import { signerCompatibility, londonToLegacy, TransactionData } from '../../../transaction'

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

export const Status = {
  INITIAL: 'Connecting',
  OK: 'ok',
  LOADING: 'loading',
  DERIVING: 'Deriving addresses',
  LOCKED: 'Please unlock your ledger',
  WRONG_APP: 'Open your Ledger and select the Ethereum application',
  DISCONNECTED: 'Disconnected',
  NEEDS_RECONNECTION: 'Please reconnect this Ledger device'
}

interface DeviceError {
  statusCode: number,
  message: string
}

interface Address {
  address: string,
  publicKey: string,
  chainCode?: string | undefined
}

function wasRequestRejected(err: DeviceError) {
  return [27013].includes(err.statusCode)
}
function isDeviceAsleep (err: DeviceError) {
  return [27404, 26628].includes(err.statusCode)
}

function needToOpenEthApp (err: DeviceError) {
  return [27904, 27906, 25873, 25871].includes(err.statusCode)
}

// additional status codes
//   27264: 'INCORRECT_DATA'

function getStatusForError (err: DeviceError) {
  if (needToOpenEthApp(err)) {
    return Status.WRONG_APP
  }
  
  if (isDeviceAsleep(err)) {
    return Status.LOCKED
  }

  if (wasRequestRejected(err)) {
    return Status.OK
  }

  return Status.NEEDS_RECONNECTION
}

export default class Ledger extends Signer {
  private eth: LedgerEthereumApp | undefined;

  devicePath: string;

  derivation: Derivation | undefined;
  accountLimit = 5;

  // the Ledger device can only handle one request at a time; the transport will reject
  // all incoming requests while its busy, so we need to make sure requests are only executed
  // when the device is ready
  private requestQueue = new RequestQueue()
  private statusPoller = setTimeout(() => {})

  constructor (devicePath: string, model: string) {
    super()

    this.devicePath = devicePath

    this.addresses = []

    this.id = uuid('Ledger' + this.devicePath, ns)
    this.type = 'ledger'
    this.model = model
    this.status = Status.INITIAL
  }

  async open () {
    const transport = await TransportNodeHid.open(this.devicePath)

    this.eth = new LedgerEthereumApp(transport)

    this.requestQueue.start()
  }

  close () {
    this.emit('close')
    this.removeAllListeners()
    
    super.close()
  }

  async connect () {
    try {
      // since the Ledger doesn't provide information about whether the eth app is open or if
      // the device is locked, the order of these checks is important in order to correctly determine
      // the exact status based on the returned error codes
      //  1. getAppConfiguration
      //  2. checkDeviceStatus
      //  3. deriveAddresses

      const config = await this.getAppConfiguration()

      this.updateStatus(Status.INITIAL)
      this.emit('update')

      // during connection is the only time we can access the device without
      // enqueuing the request, since no other requests should be active before
      // the device is connected
      await this.checkDeviceStatus()

      if (this.isReady()) {
        const [major, minor, patch] = (config.version || '1.6.1').split('.').map(n => parseInt(n))
        const version = { major, minor, patch }
        
        this.appVersion = version

        this.deriveAddresses()
      }
    } catch (err) {
      this.handleError(err as DeviceError)

      if (this.status !== Status.LOCKED) {
        return this.disconnect()
      }
    }
  }

  async disconnect () {
    if (this.status === Status.OK) {
      this.updateStatus(Status.DISCONNECTED)
      this.emit('update')
    }

    this.requestQueue.close()

    clearTimeout(this.statusPoller)

    if (this.eth) {
      await this.eth.close()
      this.eth = undefined
    }
  }

  private isReady () {
    const readyStatuses = [Status.INITIAL, Status.OK]

    return readyStatuses.includes(this.status)
  }

  private handleError (err: DeviceError) {
    const errorStatus = getStatusForError(err)

    if (errorStatus === Status.LOCKED && this.status !== Status.LOCKED) {
      this.updateStatus(Status.LOCKED)

      return this.emit('lock')
    }

    if (errorStatus !== this.status) {
      this.updateStatus(errorStatus)
      this.emit('update')

      if (this.status === Status.NEEDS_RECONNECTION) {
        this.disconnect()
      }
    }
  }

  updateStatus (status: string) {
    this.status = status

    if (this.status === Status.OK) {
      clearInterval(this.statusPoller)
      this.pollDeviceStatus(5000)
    }

    if (this.status === Status.LOCKED) {
      clearInterval(this.statusPoller)
      this.pollDeviceStatus(500)
    }
  }

  private async checkDeviceStatus () {
    const check = new Promise(async (resolve: (err: DeviceError | undefined) => void) => {
      setTimeout(() => resolve({ statusCode: -1, message: 'status check timed out' }), 3000)

      try {
        await this.eth?.getAddress("44'/60'/0'/0", false, false)
        resolve(undefined)
      } catch (e: any) {
        const err = e as DeviceError
        resolve({ message: err.message, statusCode: err.statusCode || -1 })
      }
    })

    return check.then(err => {
      if (!err) {
        // success, handle different status state transitions

        if (this.status === Status.LOCKED) {
          // when the app is unlocked, stop checking status since we will respond
          // to the unlock event and start checking for status when that's complete
          clearTimeout(this.statusPoller)

          this.emit('unlock')
        }
      } else {
        this.handleError(err)
      }

      return err?.statusCode || 0
    })
  }

  private async pollDeviceStatus (frequency: number) {
    const lastStatus = this.status

    this.statusPoller = setTimeout(() => {
      const lastRequest = this.requestQueue.peekBack()

      // prevent spamming eth app checks
      if (!lastRequest || lastRequest.type !== 'checkDeviceStatus') {
        this.enqueueRequests({
          type: 'checkDeviceStatus',
          execute: async () => {
            if (lastStatus !== this.status) {
              // check if the status changed since this event was enqueued, this
              // will prevent unintended status transitions
              return true
            }

            return this.checkDeviceStatus()
          }
        })
      }

      this.pollDeviceStatus(frequency)
    }, frequency)
  }

  private enqueueRequests (...requests: Request[]) {
    requests.forEach(req => this.requestQueue.add(req))
  }

  private getPath (index: number) {
    if (this.derivation === Derivation.live) {
      return `44'/60'/${index}'/0/0`
    }

    if (!this.derivation) {
      throw new Error('attempted to get path with unknown derivation!')
    }
  
    return getDerivationPath(this.derivation) + '/' + index
  }

  // *** request enqueuing methods *** //

  deriveAddresses () {
    this.requestQueue.clear()
    this.addresses = []

    this.updateStatus(Status.DERIVING)
    this.emit('update')

    if (this.derivation === Derivation.live) {
      this.deriveLiveAddresses()
    } else {
      this.deriveHardwareAddresses()
    }
  }

  private deriveLiveAddresses () {
    const requests = []

    for (let i = 0; i < this.accountLimit; i++) {
      requests.push({
        type: 'deriveAddresses',
        execute: async () => {
          try {
            if (!this.eth)  throw new Error('attempted to derive Live addresses but Eth app is not connected!')

            const path = this.getPath(i)
            const { address } = await this.eth.getAddress(path, false, false)

            log.debug(`Found Ledger Live address #${i}: ${address}`)

            if (this.derivation === Derivation.live) {
              // don't update if the derivation was changed while this request was running
              if (this.status === Status.DERIVING) {
                this.updateStatus(Status.OK)
              }

              this.addresses = [...this.addresses, address]

              this.emit('update')
            }
          } catch (e) {
            this.handleError(e as DeviceError)
          }
        }
      })
    }

    this.enqueueRequests(...requests)
  }

  private deriveHardwareAddresses () {
    const targetDerivation = this.derivation

    this.enqueueRequests({
      type: 'deriveAddresses',
      execute: async () => {
        try {
          if (!this.eth)  throw new Error('attempted to derive hardware addresses but Eth app is not connected!')
          if (!this.derivation) throw new Error('attempted to derive hardware addresses for unknown derivation!')

          const addresses = await this.eth.deriveAddresses(this.derivation)

          if (this.derivation === targetDerivation) {
            // don't update if the derivation was changed while this request was running
            if (this.status === Status.DERIVING) {
              this.updateStatus(Status.OK)
            }

            this.addresses = [...addresses]

            this.emit('update')
          }
        } catch (e) {
          this.handleError(e as DeviceError)
        }
      }
    })
  }

  verifyAddress (index: number, currentAddress: string, display = false, cb: Callback = () => {}) {
    this.enqueueRequests({
      type: 'verifyAddress',
      execute: async () => {
        try {
          if (!this.eth)  throw new Error('attempted to verify address but Eth app is not connected!')
          if (!this.derivation) throw new Error('attempted to verify address with unknown derivation!')

          const path = this.getPath(index)
          const result = await this.getAddress(path, display, true)

          if (result.address.toLowerCase() !== currentAddress.toLowerCase()) {
            const err = new Error('Address does not match device')
            log.error(err)

            this.handleError({ statusCode: -1, message: 'failed to verify device address' })

            return cb(err, undefined)
          }

          log.debug('Address matches device')

          cb(null, true)
        } catch (e) {
          const err = e as DeviceError
          const message = wasRequestRejected(err) ? 'Verify request rejected by user' : 'Verify address error'

          // if the address couldn't be verified for any reason the signer can no longer
          // be used, so force it to be closed by setting the status code to unhandled error
          this.handleError({ message, statusCode: -1 })
          log.error('error verifying message on Ledger', err.toString())

          cb(new Error(message), undefined)
        }
      }
    })
  }

  signMessage (index: number, message: string, cb: Callback) {
    this.enqueueRequests({
      type: 'signMessage',
      execute: async () => {
        try {
          if (!this.eth)  throw new Error('attempted to sign message but Eth app is not connected!')
          if (!this.derivation) throw new Error('attempted to sign message with unknown derivation!')

          const path = this.getPath(index)
          const signedMessage = await this.eth.signMessage(path, message)

          log.debug('successfully signed message on Ledger: ', message)

          cb(null, signedMessage)
        } catch (e) {
          const err = e as DeviceError
          const message = wasRequestRejected(err) ? 'Sign request rejected by user' : 'Sign message error'

          this.handleError(err)
          log.error('error signing message on Ledger', err.toString())

          cb(new Error(message), undefined)
        }
      }
    })
  }

  signTypedData (index: number, version: string, typedData: any, cb: Callback) {
    const versionNum = (version.match(/[Vv](\d+)/) || [])[1]

    if ((parseInt(versionNum) || 0) < 4) {
      return cb(new Error(`Invalid version (${version}), Ledger only supports eth_signTypedData version 4+`), undefined)
    }

    this.enqueueRequests({
      type: 'signTypedData',
      execute: async () => {
        try {
          if (!this.eth)  throw new Error('attempted to sign typed data but Eth app is not connected!')
          if (!this.derivation) throw new Error('attempted to sign typed data with unknown derivation!')

          const path = this.getPath(index)
          const signedData = await this.eth.signTypedData(path, typedData)

          log.debug('successfully signed typed data on Ledger: ', typedData)

          cb(null, signedData)
        } catch (e) {
          const err = e as DeviceError
          const message = wasRequestRejected(err) ? 'Sign request rejected by user' : 'Sign message error'

          this.handleError(err)
          log.error('error signing typed data on Ledger', err.toString())

          cb(new Error(message), undefined)
        }
      }
    })
  }

  signTransaction (index: number, rawTx: TransactionData, cb: Callback) {
    const compatibility = signerCompatibility(rawTx, this.summary())
    const ledgerTx = compatibility.compatible ? { ...rawTx } : londonToLegacy(rawTx)

    this.enqueueRequests({
      type: 'signTransaction',
      execute: async () => {
        try {
          if (!this.eth)  throw new Error('attempted to sign transaction but Eth app is not connected!')
          if (!this.derivation) throw new Error('attempted to sign transaction with unknown derivation!')

          const path = this.getPath(index)
          const signedTx = await this.eth.signTransaction(path, ledgerTx)

          log.debug('successfully signed transaction on Ledger: ', ledgerTx)

          cb(null, signedTx)
        } catch (e) {
          const err = e as DeviceError
          const message = wasRequestRejected(err) ? 'Sign request rejected by user' : 'Sign transaction error'

          this.handleError(err)
          log.error('error signing transaction on Ledger', err.toString())

          cb(new Error(message), undefined)
        }
      }
    })
  }

  // *** direct device access methods *** //

  private async getAddress (path: string, display = false, chainCode = false) {
    return new Promise((resolve: (address: Address) => void, reject) => {
      if (!this.eth) {
        return reject(new Error('tried to get address but Eth app is not connected!'))
      }

      let fallback = setTimeout(() => {})

      if (!display) {
        // if display is true, the Ledger waits for user input so never time out
        fallback = setTimeout(() => reject({ message: 'getAddress timed out', statusCode: -1 }), 3000)
      }

      this.eth.getAddress(path, display, chainCode).then(resolve).catch(reject).finally(() => clearTimeout(fallback))
    })
  }

  private async getAppConfiguration () {
    // if this call blocks and we are not yet connected it means that the Ledger is locked and 
    // the eth app is not open; if the Ledger is locked and eth app IS open, this should return successfully

    return new Promise((resolve: (config: { version: string }) => void, reject) => {
      if (!this.eth) {
        return reject(new Error('tried to get app configuration but Eth app is not connected!'))
      }

      const fallback = setTimeout(() => {
        const statusCode = (this.status === Status.INITIAL) ? 27904 : -1
        reject({ message: 'getAppConfiguration timed out', statusCode })
      }, 1000)

      this.eth.getAppConfiguration().then(resolve).catch(reject).finally(() => clearTimeout(fallback))
    })
  }
}
