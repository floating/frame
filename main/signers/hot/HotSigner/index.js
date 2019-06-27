const path = require('path')
const fs = require('fs')
const { app } = require('electron')
const log = require('electron-log')
const uuid = require('uuid/v4')

const store = require('../../../store')
const Signer = require('../../Signer')

const FILE_PATH = path.resolve(app.getPath('userData'), 'signers.json')

class HotSigner extends Signer {
  constructor (signer) {
    super()
    this.type = signer.type
    this.addresses = signer.addresses
    this.status = 'locked'
    this.update()
  }

  save (data) {
    let storedSigners = {}

    // Try to read stored signers from disk
    try { storedSigners = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8')) }
    catch (e) { console.error(e) }

    // Add signer to stored signers
    const { id, addresses, type } = this
    storedSigners[id] = { id, addresses, type, ...data }

    // Write to disk
    fs.writeFileSync(FILE_PATH, JSON.stringify(storedSigners))

    // Log
    log.info('Signer saved to disk')
  }

  delete () {
    let storedSigners = {}

    // Try to read stored signers from disk
    try { storedSigners = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8')) }
    catch (e) { console.error(e) }

    // Remove signer from stored signers
    delete storedSigners[this.id]
    fs.writeFileSync(FILE_PATH, JSON.stringify(storedSigners))

    // Log
    log.info('Signer erased from disk')
  }

  lock (cb) {
    this._callWorker({ method: 'lockAccount' }, () => {
      this.status = 'locked'
      this.update()
      cb(null)
      log.info('Signer locked')
    })
  }

  unlock (password, data, cb) {
    const payload = {
      method: 'unlockAccount',
      params: { password, ...data }
    }
    this._callWorker(payload, (err, result) => {
      if (err) return cb(err)
      this.status = 'ok'
      this.update()
      log.info('Signer unlocked')
      cb(null)
    })
  }

  close () {
    this.worker.disconnect()
    store.removeSigner(this.id)
    super.close()
    log.info('Signer closed')
  }

  update () {
    // Get derived ID
    let id = this.addressesId()

    // On new ID ->
    if (!this.id) {
      this.id = id
    }

    // On changed ID ->
    else if (this.id !== id) {
      // Update id
      this.id = id
      // Remove from store
      store.removeSigner(this.id)
      // Erase from disk
      this.delete(this.id)
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
    if (!this.worker) throw Error('Worker not running')
    const id = uuid()
    const listener = (message) => {
      if (message.id === id) {
        let error = message.error ? new Error(message.error) : null
        cb(error, message.result)
        this.worker.removeListener('message', listener)
      }
    }
    this.worker.addListener('message', listener)
    this.worker.send({ id, ...payload })
  }
}

module.exports = HotSigner
