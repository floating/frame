const path = require('path')
const { fork } = require('child_process')

const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class SeedSigner extends HotSigner {
  constructor (signer) {
    super(signer)
    this.seed = signer.seed
    this.worker = fork(WORKER_PATH)
  }

  save () { super.save({ seed: this.seed }) }
  unlock (password) { super.unlock(password, { encryptedSeed: this.seed }) }
}

module.exports = SeedSigner
