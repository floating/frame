import path from 'path'
import fs from 'fs'
import log from 'electron-log'
import { app } from 'electron'
import { ChildProcess, fork } from 'child_process'
import { ensureDirSync, removeSync } from 'fs-extra'
import { v4 as uuid } from 'uuid'

import { stringToKey } from '../../../crypt'
import Signer from '../../Signer'
import store from '../../../store'

import type { TransactionData } from '../../../../resources/domain/transaction'
import type { TypedMessage } from '../../../accounts/types'
import { RPCMessage, RPCMethod, WorkerMessage, WorkerRPCMessage, WorkerTokenMessage } from './types'

// TODO: remove these when updating tests
const windows = app ? require('../../../windows') : { broadcast: () => {} }
// Mock user data dir during tests
const USER_DATA = app
  ? app.getPath('userData')
  : // @ts-ignore
    path.resolve(path.dirname(require.main.filename), '../.userData')

const SIGNERS_PATH = path.resolve(USER_DATA, 'signers')
const WORKER_PATH = path.resolve(__dirname, 'worker.js')

type RPCMessagePayload = {
  method: RPCMethod
  params?: any
}

export default class HotSigner extends Signer {
  private ready = false
  private token = ''

  private readonly worker: ChildProcess

  constructor(type: HotSignerType) {
    super()

    this.type = type
    this.status = 'locked'

    // TODO: remove stdio inherit after done debugging
    this.worker = fork(WORKER_PATH, [type], { stdio: 'inherit' })
    this.getToken()
  }

  protected save(data?: any) {
    // Construct signer
    const { id, addresses, type } = this
    const signer = { id, addresses, type, ...data }

    // Ensure signers directory exists
    ensureDirSync(SIGNERS_PATH)

    // Write signer to disk
    fs.writeFileSync(path.resolve(SIGNERS_PATH, `${id}.json`), JSON.stringify(signer), { mode: 0o600 })

    // Log
    log.debug('Signer saved to disk')
  }

  delete() {
    const signerPath = path.resolve(SIGNERS_PATH, `${this.id}.json`)

    // Overwrite file
    fs.writeFileSync(signerPath, '00000000000000000000000000000000000000000000000000000000000000000000', {
      mode: 0o600
    })

    // Remove file
    removeSync(signerPath)

    // Log
    log.info('Signer erased from disk')
  }

  lock(cb: ErrorOnlyCallback) {
    this.callWorker({ method: 'lock' }, () => {
      this.status = 'locked'
      this.update()
      log.info('Signer locked')
      cb(null)
    })
  }

  unlock(password: string, data: any, cb: ErrorOnlyCallback) {
    const params = { password, ...data }

    this.callWorker({ method: 'unlock', params }, (err, result) => {
      if (err) return cb(err)
      this.status = 'ok'
      this.update()
      log.info('Signer unlocked')
      cb(null)
    })
  }

  close() {
    if (this.ready) this.worker.disconnect()
    else this.once('ready', () => this.worker.disconnect())
    store.removeSigner(this.id)
    log.info('Signer closed')
  }

  update() {
    // Get derived ID
    const derivedId = this.fingerprint()

    // On new ID ->
    if (!this.id) {
      // Update id
      this.id = derivedId
      // Write to disk
      this.save()
    } else if (this.id !== derivedId) {
      // On changed ID
      // Erase from disk
      this.delete()
      // Remove from store
      store.removeSigner(this.id)
      // Update id
      this.id = derivedId
      // Write to disk
      this.save()
    }

    store.updateSigner(this.summary())
    log.info('Signer updated')
  }

  signMessage(index: number, message: string, cb: Callback<string>) {
    const payload = { method: 'signMessage', params: { index, message } } as const
    this.callWorker(payload, cb as Callback<unknown>)
  }

  signTypedData(index: number, typedMessage: TypedMessage, cb: Callback<string>) {
    const payload = { method: 'signTypedData', params: { index, typedMessage } } as const
    this.callWorker(payload, cb as Callback<unknown>)
  }

  signTransaction(index: number, rawTx: TransactionData, cb: Callback<string>) {
    const payload = { method: 'signTransaction', params: { index, rawTx } } as const
    this.callWorker(payload, cb as Callback<unknown>)
  }

  verifyAddress(index: number, address: string, display: boolean, cb: Callback<boolean>) {
    const payload = { method: 'verifyAddress', params: { index, address } } as const

    this.callWorker(payload, (err, isVerified) => {
      const verified = isVerified as boolean

      if (err || !verified) {
        if (!err) {
          store.notify('hotSignerMismatch')
          err = new Error('Unable to verify address')
        }
        this.lock(() => {
          if (err) {
            log.error('HotSigner verifyAddress: Unable to verify address')
          } else {
            log.error('HotSigner verifyAddress: Address mismatch')
          }
          log.error(err)
        })
        cb(err)
      } else {
        log.info('Hot signer verify address matched')
        cb(null, verified)
      }
    })
  }

  private fingerprint() {
    if (this.addresses && this.addresses.length) {
      return stringToKey(this.addresses.join()).toString('hex')
    }

    return ''
  }

  private getToken() {
    const listener = (message: WorkerMessage) => {
      if (message.type === 'token') {
        this.token = (message as WorkerTokenMessage).token
        this.worker.removeListener('message', listener)
        this.ready = true
        this.emit('ready')
      }
    }

    this.worker.addListener('message', listener)
  }

  protected callWorker(payload: RPCMessagePayload, cb: Callback<unknown>): void {
    if (!this.worker) throw Error('Worker not running')
    // If token not yet received -> retry in 100 ms
    if (!this.token) return void setTimeout(() => this.callWorker(payload, cb), 100)
    // Generate message id
    const id = uuid()
    // Handle response
    const listener = (msg: WorkerMessage) => {
      if (msg.type === 'rpc') {
        const message = msg as WorkerRPCMessage

        if (message.id) {
          const response = message as WorkerRPCMessage
          const error = response.error ? new Error(response.error) : null
          cb(error, response.result)
          this.worker.removeListener('message', listener)
        }
      }
    }

    this.worker.addListener('message', listener)

    // Make RPC call
    const { method, params } = payload
    const message: RPCMessage = { id, token: this.token, method, params }
    this.worker.send(message)
  }
}
