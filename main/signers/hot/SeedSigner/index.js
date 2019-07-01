const path = require('path')
const { fork } = require('child_process')

const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class SeedSigner extends HotSigner {
  constructor (signer) {
    super(signer)
    this.encryptedSeed = signer.encryptedSeed
    this.worker = fork(WORKER_PATH)
    this.update()
  }

  save () {
    super.save({ encryptedSeed: this.encryptedSeed })
  }

  unlock (password, cb) {
    super.unlock(password, { encryptedSeed: this.encryptedSeed }, cb)
  }
}

module.exports = SeedSigner
