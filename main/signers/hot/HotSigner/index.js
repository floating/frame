const path = require('path')
const fs = require('fs')
const { fork } = require('child_process')
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
      log.info('Signer locked')
      cb(null, 'ok')
    })
  }

  close () {
    this.worker.disconnect()
    store.removeSigner(this.id)
    log.info('Signer closed')
    super.close()
  }

  update () {
    let id = this.addressesId()
    if (this.id !== id) { // Singer address representation changed
      store.removeSigner(this.id)
      this.id = id
    }
    store.updateSigner(this.summary())
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
