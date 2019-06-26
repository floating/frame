const path = require('path')
const { fork } = require('child_process')

const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class RingSigner extends HotSigner {
  constructor (signer) {
    super(signer)
    this.encryptedKeys = signer.encryptedKeys
    this.worker = fork(WORKER_PATH)
    setTimeout(() => {
      this.unlock('frame')
      setTimeout(() => {
        this._debug()
      }, 1000)
    }, 1000)
  }

  save () { super.save({ encryptedKeys: this.encryptedKeys }) }
  unlock (password) { super.unlock(password, { encryptedKeys: this.encryptedKeys }) }
}

module.exports = RingSigner
