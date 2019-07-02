const path = require('path')
const fs = require('fs')
const { ensureDirSync, removeSync } = require('fs-extra')
const { fork } = require('child_process')
const { app } = require('electron')
const log = require('electron-log')
const uuid = require('uuid/v4')
const crypto = require('crypto')

const store = require('../../../store')
const Signer = require('../../Signer')

const USER_DATA = app ? app.getPath('userData') : './test/.userData'
const SIGNERS_PATH = path.resolve(USER_DATA, 'signers')

class HotSigner extends Signer {
  constructor (signer, workerPath) {
    super()
    this.type = signer.type
    this.addresses = signer.addresses || []
    this.status = 'locked'
    this._workerToken = uuid()
    this._workerTokenHash = crypto.createHash('sha256').update(this._workerToken).digest('hex')
    this._worker = fork(workerPath, [this._workerTokenHash])
  }

  save (data) {
    // Construct signer
    const { id, addresses, type } = this
    const signer = { id, addresses, type, ...data }

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

  close (cb) {
    this._worker.disconnect()
    store.removeSigner(this.id)
    super.close()
    log.info('Signer closed')
    cb(null)
  }

  update () {
    // Get derived ID
    let derivedId = this.addressesId()

    // On new ID ->
    if (!this.id) {
      // Update id
      this.id = derivedId
      // Write to disk
      this.save({ encryptedKeys: this.encryptedKeys, encryptedSeed: this.encryptedSeed })
    }

    // On changed ID ->
    else if (this.id !== derivedId) {
      // Erase from disk
      this.delete(this.id)
      // Update id
      this.id = derivedId
      // Remove from store
      store.removeSigner(this.id)
      // Write to disk
      this.save({ encryptedKeys: this.encryptedKeys, encryptedSeed: this.encryptedSeed })
    }

    store.updateSigner(this.summary())
    // console.log(this)
    log.info('Signer updated')
  }

  signMessage (index, message, cb) {
    const payload = { method: 'signMessage', params: { index, message } }
    this._callWorker(payload, cb)
  }

  signTransaction (index, rawTx, cb) {
    const payload = { method: 'signTransaction', params: { index, rawTx } }
    this._callWorker(payload, cb)
  }

  verifyAddress (index, address, cb) {
    const payload = { method: 'verifyAddress', params: { index, address } }
    this._callWorker(payload, cb)
  }

  _callWorker (payload, cb) {
    if (!this._worker) throw Error('Worker not running')
    const id = uuid()
    const listener = (message) => {
      if (message.id === id) {
        let error = message.error ? new Error(message.error) : null
        cb(error, message.result)
        this._worker.removeListener('message', listener)
      }
    }
    this._worker.addListener('message', listener)
    this._worker.send({ id, token: this._workerToken, ...payload })
  }
}

module.exports = HotSigner
