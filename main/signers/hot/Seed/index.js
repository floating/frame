const path = require('path')
const fs = require('fs')
const { fork } = require('child_process')
const { app } = require('electron')
const log = require('electron-log')
const { hashPersonalMessage, toBuffer, ecsign, addHexPrefix, pubToAddress, ecrecover } = require('ethereumjs-util')
const uuid = require('uuid/v4')

const crypt = require('../../../crypt')
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
    this.unlockedSeed = ''
    this.status = 'initial'

    // Spawn worker process
    this.worker = fork(path.resolve(__dirname, 'worker.js'))
    this._debug()

    // this.unlock('frame')
    setTimeout(() => {
      this.status = 'locked'
      this.update()
    }, 3000)
    this.update()
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
  lock () {
    delete this.unlockedSeed
    this.status = 'locked'
    this.update()
  }
  unlock (password) {
    crypt.decrypt(this.seed, password, (err, seed) => {
      if (err) return console.log(err)
      this.unlockedSeed = seed
      this.status = 'ok'
      this.update()
      // this.verifyAddress(0, this.addresses[0], (err, verified) => {
      //   if (err || !verified) return log.error(err || new Error(`Constructor of ${this.type} signer could not verify current index...`))
      //   log.info('Successfully verified address for initial index...')
      // })
    })
  }
  // Standard Methods
  signMessage (index, message, cb) {
    const payload = {
      method: 'signMessage',
      params: { index, message, encryptedSeed: this.seed, password: 'frame' }
    }
    this._callWorker(payload, cb)
  }
  signTransaction (index, rawTx, cb) {
    const payload = {
      method: 'signTransaction',
      params: { index, rawTx, encryptedSeed: this.seed, password: 'frame' }
    }
    this._callWorker(payload, console.log)
  }
  verifyAddress (index, address, cb) {
    const message = uuid()
    this.signMessage(index, message, (err, signed) => {
      if (err) return cb(err)
      // Verify
      const signature = Buffer.from(signed.replace('0x', ''), 'hex')
      if (signature.length !== 65) cb(new Error(`Frame verifyAddress signature has incorrect length`))
      let v = signature[64]
      v = v === 0 || v === 1 ? v + 27 : v
      let r = toBuffer(signature.slice(0, 32))
      let s = toBuffer(signature.slice(32, 64))
      const hash = hashPersonalMessage(toBuffer(message))
      const verifiedAddress = '0x' + pubToAddress(ecrecover(hash, v, r, s)).toString('hex')
      cb(null, verifiedAddress.toLowerCase() === address.toLowerCase())
    })
  }
  close () {
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
        cb(null, message.result)
        this.worker.removeListener('message', listener)
      }
    }
    this.worker.addListener('message', listener)
    this.worker.send({ id, ...payload })
  }
  _debug () {
    // Sign message
    const message = 'test'
    this.signMessage(0, message, console.log)

    // Sign tx
    let rawTx = {
      nonce: '0x6',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x30000',
      to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
      value: '0x00'
    }
    this.signTransaction(0, rawTx, console.log)
  }
}

module.exports = Seed
