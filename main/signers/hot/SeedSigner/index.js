const path = require('path')
const { fork } = require('child_process')

const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class SeedSigner extends HotSigner {
  constructor (signer) {
    super(signer)
    this.encryptedSeed = signer.encryptedSeed
    this.worker = fork(WORKER_PATH)
  }

  save () { super.save({ encryptedSeed: this.encryptedSeed }) }
  unlock (password) { super.unlock(password, { encryptedSeed: this.encryptedSeed }) }
}

module.exports = SeedSigner
