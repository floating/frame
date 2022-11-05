import path from 'path'
import fs from 'fs'
import { ensureDirSync, removeSync } from 'fs-extra'
import { ChildProcess, fork } from 'child_process'
import { app } from 'electron'
import log from 'electron-log'
import { v4 as uuid } from 'uuid'

import Signer from '../../Signer'
import store from '../../../store'
import type { TypedMessage } from '../../../accounts/types'
import { TransactionData } from '../../../../resources/domain/transaction'
// Mock windows module during tests
const windows = app ? require('../../../windows') : { broadcast: () => {} }
// Mock user data dir during tests
const USER_DATA = app ? app.getPath('userData') : path.resolve(path.dirname(require.main ? require.main.filename : ''), '../.userData')
const SIGNERS_PATH = path.resolve(USER_DATA, 'signers')

export type StoredSigner = {
  id: string
  addresses: string[]
  encryptedKeys?: string[]
  encryptedSeed?: string
  type: string
  network: string
}

export type SignerData = {
  encryptedKeys?: string[]
  encryptedSeed?: string
}

export type WorkerPayload = {
  method: string,
  params?: {

  }
}

export class HotSigner extends Signer {
  private ready = false
  private network = ''
  private worker: ChildProcess
  private token = ''
  protected encryptedKeys?: string[]
  protected encryptedSeed?: string
  public status = 'locked'
  
  constructor (workerPath: string, signer?: StoredSigner, ) {
    super()
    this.addresses = signer ? signer.addresses : []
    this.worker = fork(workerPath)
    this._getToken()
  }

  save (data: SignerData) {
    // Construct signer
    const { id, addresses, type, network } = this
    const signer = { id, addresses, type, network, ...data }

    // Ensure signers directory exists
    ensureDirSync(SIGNERS_PATH)

    // Write signer to disk
    fs.writeFileSync(path.resolve(SIGNERS_PATH, `${id}.json`), JSON.stringify(signer), { mode: 0o600 })

    // Log
    log.debug('Signer saved to disk')
  }

  delete () {
    const signerPath = path.resolve(SIGNERS_PATH, `${this.id}.json`)

    // Overwrite file
    fs.writeFileSync(signerPath, '00000000000000000000000000000000000000000000000000000000000000000000', { mode: 0o600 })

    // Remove file
    removeSync(signerPath)

    // Log
    log.info('Signer erased from disk')
  }

  lock (cb: Callback<Signer>) {
    this.callWorker({ method: 'lock' }, () => {
      this.status = 'locked'
      this.update()
      log.info('Signer locked')
      cb(null)
    })
  }

  unlock (password: string, data: SignerData, cb: Callback<Signer>) {
    const params = { password, ...data }
    this.callWorker({ method: 'unlock', params }, (err: Error | null, _result?: unknown) => {
      if (err) return cb(err)
      this.status = 'ok'
      this.update()
      log.info('Signer unlocked')
      cb(null)
    })
  }

  close () {
    if (this.ready) this.worker.disconnect()
    else this.once('ready', () => this.worker.disconnect())
    store.removeSigner(this.id)
    log.info('Signer closed')
  }

  update () {
    // Get derived ID
    const derivedId = this.fingerprint()

    // On new ID ->
    if (!this.id) {
      // Update id
      this.id = derivedId as string
      // Write to disk
      this.save({ encryptedKeys: this.encryptedKeys, encryptedSeed: this.encryptedSeed })
    } else if (this.id !== derivedId) { // On changed ID
      // Erase from disk
      this.delete()
      // Remove from store
      store.removeSigner(this.id)
      // Update id
      this.id = derivedId as string
      // Write to disk
      this.save({ encryptedKeys: this.encryptedKeys, encryptedSeed: this.encryptedSeed })
    }

    store.updateSigner(this.summary())
    log.info('Signer updated')
  }

  signMessage (index: number, message: string, cb: Callback<string>) {
    const payload = { method: 'signMessage', params: { index, message } }
    this.callWorker(payload, cb)
  }

  signTypedData (index: number, typedMessage: TypedMessage, cb: Callback<string>) {
    console.log('got td', typedMessage)
    const payload = { method: 'signTypedData', params: { index, typedMessage } }
    this.callWorker(payload, cb)
  }

  signTransaction (index: number, rawTx: TransactionData, cb: Callback<string>) {
    const payload = { method: 'signTransaction', params: { index, rawTx } }
    this.callWorker(payload, cb)
  }

  verifyAddress (index: number, address: string, display: boolean, cb: Callback<boolean>) {
    const payload = { method: 'verifyAddress', params: { index, address } }
    this.callWorker(payload, (err: Error | null, verified?: string) => {
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
        cb(null, verified === 'true')
      }
    })
  }

  _getToken () {
    const listener = ({ type, token }: { type: string, token: string }) => {
      if (type === 'token') {
        this.token = token
        this.worker.removeListener('message', listener)
        this.ready = true
        this.emit('ready')
      }
    }
    this.worker.addListener('message', listener)
  }

  protected callWorker (payload: WorkerPayload, cb: Callback<any>): void | NodeJS.Timeout {
    if (!this.worker) throw Error('Worker not running')
    // If token not yet received -> retry in 100 ms
    if (!this.token) return setTimeout(() => this.callWorker(payload, cb), 100)
    // Generate message id
    const id = uuid()
    // Handle response
    const listener = (response: any) => {
      if (response.type === 'rpc' && response.id === id) {
        const error = response.error ? new Error(response.error) : null
        cb(error, response.result)
        this.worker.removeListener('message', listener)
      }
    }
    this.worker.addListener('message', listener)
    // Make RPC call
    this.worker.send({ id, token: this.token, ...payload })
  }
}
