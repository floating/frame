const path = require('path')
const fs = require('fs')
const { ensureDirSync, removeSync } = require('fs-extra')
const { fork } = require('child_process')
const { app } = require('electron')
const log = require('electron-log')
const uuid = require('uuid/v4')

const store = require('../../../store')
const Signer = require('../../Signer')

const USER_DATA = app ? app.getPath('userData') : './test/.userData'
const SIGNERS_PATH = path.resolve(USER_DATA, 'signers')

class HotSigner extends Signer {
  constructor (signer, workerPath) {
    super()
    this.status = 'locked'
    if (signer) {
      this.network = signer.network || store('main.connection.network')
      this.addresses = signer.addresses || []
    } else {
      this.network = store('main.connection.network')
      this.addresses = []
    }
    this._worker = fork(workerPath)
    this._getToken()
  }

  save (data) {
    // Construct signer
    const { id, addresses, type, network } = this
    const signer = { id, addresses, type, network, ...data }

    // Ensure signers directory exists
    ensureDirSync(SIGNERS_PATH)

    // Write signer to disk
    fs.writeFileSync(path.resolve(SIGNERS_PATH, `${id}.json`), JSON.stringify(signer))

    // Log
    log.info('Signer saved to disk')
  }

  delete () {
    // Remove file
    removeSync(path.resolve(SIGNERS_PATH, `${this.id}.json`))

    // Log
    log.info('Signer erased from disk')
  }

  lock (cb) {
    this._callWorker({ method: 'lock' }, () => {
      this.status = 'locked'
      this.update()
      log.info('Signer locked')
      cb(null)
    })
  }

  unlock (password, data, cb) {
    const params = { password, ...data }
    this._callWorker({ method: 'unlock', params }, (err, result) => {
      if (err) return cb(err)
      this.status = 'ok'
      this.update()
      log.info('Signer unlocked')
      cb(null)
    })
  }

  close () {
    this._worker.disconnect()
    store.removeSigner(this.id)
    log.info('Signer closed')
  }

  update () {
    // Get derived ID
    const derivedId = this.fingerprint()

    // On new ID ->
    if (!this.id) {
      // Update id
      this.id = derivedId
      // Write to disk
      this.save({ encryptedKeys: this.encryptedKeys, encryptedSeed: this.encryptedSeed })
    } else if (this.id !== derivedId) { // On changed ID
      // Erase from disk
      this.delete(this.id)
      // Remove from store
      store.removeSigner(this.id)
      // Update id
      this.id = derivedId
      // Write to disk
      this.save({ encryptedKeys: this.encryptedKeys, encryptedSeed: this.encryptedSeed })
    }

    store.updateSigner(this.summary())
    log.info('Signer updated')
  }

  signMessage (index, message, cb) {
    if (this.network !== store('main.connection.network')) return cb(new Error(`Signer is locked to network ${this.network} and we are on network ${store('main.connection.network')}`))
    const payload = { method: 'signMessage', params: { index, message } }
    this._callWorker(payload, cb)
  }

  signTypedData (index, typedData, cb) {
    if (this.network !== store('main.connection.network')) return cb(new Error(`Signer is locked to network ${this.network} and we are on network ${store('main.connection.network')}`))
    const payload = { method: 'signTypedData', params: { index, typedData } }
    this._callWorker(payload, cb)
  }

  signTransaction (index, rawTx, cb) {
    if (this.network !== store('main.connection.network')) return cb(new Error(`Signer is locked to network ${this.network} and we are on network ${store('main.connection.network')}`))
    const payload = { method: 'signTransaction', params: { index, rawTx } }
    this._callWorker(payload, cb)
  }

  verifyAddress (index, address) {
    const payload = { method: 'verifyAddress', params: { index, address } }
    this._callWorker(payload, (err, verified) => {
      if (err || !verified) {
        this.lock(() => log.warn('Unable to verify address, signer locked'))
      } else {
        log.info('Hot signer verify address matched')
      }
    })
  }

  _getToken () {
    const listener = ({ type, token }) => {
      if (type === 'token') {
        this._token = token
        this._worker.removeListener('message', listener)
      }
    }
    this._worker.addListener('message', listener)
  }

  _callWorker (payload, cb) {
    if (!this._worker) throw Error('Worker not running')
    // If token not yet received -> retry in 100 ms
    if (!this._token) return setTimeout(() => this._callWorker(payload, cb), 100)
    // Generate message id
    const id = uuid()
    // Handle response
    const listener = (response) => {
      if (response.type === 'rpc' && response.id === id) {
        const error = response.error ? new Error(response.error) : null
        cb(error, response.result)
        this._worker.removeListener('message', listener)
      }
    }
    this._worker.addListener('message', listener)
    // Make RPC call
    this._worker.send({ id, token: this._token, ...payload })
  }
}

module.exports = HotSigner
