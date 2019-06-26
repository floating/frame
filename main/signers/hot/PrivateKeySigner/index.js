const path = require('path')
const { fork } = require('child_process')

const Signer = require('../../Signer')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class PrivateKeySigner extends Signer {
  constructor (signer) {
    super()
    this.id = signer.id
    this.type = signer.type
    this.accounts = signer.accounts
    this.worker = fork(WORKER_PATH)
  }
  
  signMessage (message, cb) {
    const payload = { method: 'signMessage', params: { message } }
    this._callWorker(payload, cb)
  }

  signTransaction (rawTx, cb) {
    const payload = { method: 'signTransaction', params: { rawTx } }
    this._callWorker(payload, cb)
  }
}

module.exports = PrivateKeySigner
