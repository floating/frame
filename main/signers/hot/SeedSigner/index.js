const path = require('path')
const HotSigner = require('../HotSigner')
const bip39 = require('bip39')
const hdKey = require('ethereumjs-wallet/hdkey')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class SeedSigner extends HotSigner {
  constructor (signer) {
    super(signer, WORKER_PATH)
    this.encryptedSeed = (signer && signer.encryptedSeed)
    this.type = 'seed'
    if (this.encryptedSeed) this.update()
  }

  addSeed (seed, password, cb) {
    if (this.encryptedSeed) return cb(new Error('This signer already has a seed'))

    this._callWorker({ method: 'encryptSeed', params: { seed, password } }, (err, encryptedSeed) => {
      if (err) return cb(err)

      // Derive addresses
      const wallet = hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0')
      const addresses = []
      for (var i = 0; i < 100; i++) { addresses.push(wallet.deriveChild(i).getWallet().getChecksumAddressString()) }

      // Update signer
      this.encryptedSeed = encryptedSeed
      this.addresses = addresses
      this.update()

      cb(null)
    })
  }

  async addPhrase (phrase, password, cb) {
    // Validate phrase
    if (!bip39.validateMnemonic(phrase)) return cb(new Error('Invalid mnemonic phrase'))
    // Get seed
    const seed = await bip39.mnemonicToSeed(phrase)
    // Add seed to signer
    this.addSeed(seed.toString('hex'), password, cb)
  }

  save () {
    super.save({ encryptedSeed: this.encryptedSeed })
  }

  unlock (password, cb) {
    super.unlock(password, { encryptedSeed: this.encryptedSeed }, cb)
  }
}

module.exports = SeedSigner
