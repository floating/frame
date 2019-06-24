const path = require('path')
const fs = require('fs')
const { fork } = require('child_process')
const { app } = require('electron')
const log = require('electron-log')
const uuid = require('uuid/v4')

const store = require('../../../store')
const Signer = require('../../Signer')

// const addressSigner = (seed, index) => {
//   return hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0').deriveChild(index).getWallet().getPrivateKey()
// }

class Seed extends Signer {
  constructor (signer) {
    super()
    log.info('Creating seed signer instance')
    this.type = signer.type
    this.addresses = signer.addresses
    this.seed = signer.seed
    this.status = 'locked'
    this.update()

    // Spawn worker process
    this.worker = fork(path.resolve(__dirname, 'worker.js'))
    this._debug()
  }
  save () {
    const signersPath = path.resolve(app.getPath('userData'), 'signers.json')
    let storedSigners = {}

    // Try to read stored signers from disk
    try { storedSigners = JSON.parse(fs.readFileSync(signersPath, 'utf8')) }
    catch (e) { console.error(e) }

    // Add this signer to stored signers
    const { id, addresses, seed, type } = this
    storedSigners[id] = { addresses, seed, type }

    // Write to disk
    fs.writeFileSync(signersPath, JSON.stringify(storedSigners))
  }
  unlock (password) {
    const payload = {
      method: 'unlockAccount',
      params: { encryptedSeed: this.seed, password }
    }
    this._callWorker(payload, (err, result) => {
      if (!err) {
        this.status = 'ok'
        this.update()
      }
    })
  }
  lock () {
    this._callWorker({ method: 'lockAccount' }, () => {
      this.status = 'locked'
      this.update()
    })
  }
  signMessage (index, message, cb) {
    const payload = {
      method: 'signMessage',
      params: { index, message }
    }
    this._callWorker(payload, cb)
  }
  signTransaction (index, rawTx, cb) {
    const payload = {
      method: 'signTransaction',
      params: { index, rawTx }
    }
    this._callWorker(payload, cb)
  }
  verifyAddress (index, address, cb) {
    const payload = {
      method: 'verifyAddress',
      params: { index, address }
    }
    this._callWorker(payload, cb)
  }
  close () {
    this.worker.disconnect()
    store.removeSigner(this.id)
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
  _debug () {

    // setTimeout(() => {
    //   this.unlock('frame', console.log)
    // }, 2000)
    // setTimeout(() => {
    //   this.signMessage(0, 'fisk', console.log)
    //   this.lock()
    // }, 3000)
    // setTimeout(() => {
    //   this.signMessage(0, 'fisk', console.log)
    // }, 4000)

    // // Sign message
    // const message = 'test'
    // this.signMessage(0, message, console.log)

    // // Sign tx
    // let rawTx = {
    //   nonce: '0x6',
    //   gasPrice: '0x09184e72a000',
    //   gasLimit: '0x30000',
    //   to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
    //   value: '0x00'
    // }
    // this.signTransaction(0, rawTx, console.log)

    // this.verifyAddress(0, this.addresses[0], console.log)
  }
}

module.exports = Seed
