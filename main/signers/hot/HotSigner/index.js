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
      cb(null, 'ok')
      log.info('Signer locked')
    })
  }

  unlock (password, data) {
    const payload = {
      method: 'unlockAccount',
      params: { password, ...data }
    }
    this._callWorker(payload, (err, result) => {
      if (!err) {
        this.status = 'ok'
        this.update()
        log.info('Signer unlocked')
      }
    })
  }

  close () {
    this.worker.disconnect()
    store.removeSigner(this.id)
    super.close()
    log.info('Signer closed')
  }

  update () {
    let id = this.addressesId()
    console.log(id)
    if (this.id !== id) { // Singer address representation changed
      store.removeSigner(this.id)
      this.id = id
    }
    log.info('Signer updated')
    store.updateSigner(this.summary())
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
  _debug () {
    // Sign message
    this.signMessage(0, 'test', console.log)

    // Sign tx
    let rawTx = {
      nonce: '0x6',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x30000',
      to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
      value: '0x00'
    }
    this.signTransaction(0, rawTx, console.log)

    this.verifyAddress(0, this.addresses[0], console.log)
  }
}

module.exports = HotSigner
