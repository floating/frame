const path = require('path')
const { fork } = require('child_process')
const log = require('electron-log')

const store = require('../../../store')
const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class SeedSigner extends HotSigner {
  constructor (signer) {
    super(signer)
    log.info('Creating seed signer instance')
    this.seed = signer.seed
    this.worker = fork(WORKER_PATH)
  }

  save () {
    super.save({ seed: this.seed })
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

module.exports = SeedSigner
