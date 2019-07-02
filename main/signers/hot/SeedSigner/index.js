const path = require('path')
const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class SeedSigner extends HotSigner {
  constructor (signer) {
    super(signer, WORKER_PATH)
    this.encryptedSeed = signer.encryptedSeed
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
