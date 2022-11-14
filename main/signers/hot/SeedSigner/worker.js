const hdKey = require('hdkey')
const HotSignerWorker = require('../HotSigner/worker')

class SeedSignerWorker extends HotSignerWorker {
  constructor () {
    super()
    this.seed = null
    process.on('message', (message) => this.handleMessage(message))
  }

  unlock ({ encryptedSeed, password }, pseudoCallback) {
    try {
      this.seed = this._decrypt(encryptedSeed, password)
      pseudoCallback(null)
    } catch (e) {
      pseudoCallback('Invalid password')
    }
  }

  lock (_, pseudoCallback) {
    this.seed = null
    pseudoCallback(null)
  }

  encryptSeed ({ seed, password }, pseudoCallback) {
    pseudoCallback(null, this._encrypt(seed.toString('hex'), password))
  }

  signMessage ({ index, message }, pseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return pseudoCallback('Signer locked')
    // Derive private key
    const key = this._derivePrivateKey(index)
    // Sign message
    super.signMessage(key, message, pseudoCallback)
  }

  signTypedData ({ index, typedMessage }, pseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return pseudoCallback('Signer locked')
    // Derive private key
    const key = this._derivePrivateKey(index)
    // Sign message
    super.signTypedData({ key, typedMessage }, pseudoCallback)
  }

  signTransaction ({ index, rawTx }, pseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return pseudoCallback('Signer locked')
    // Derive private key
    const key = this._derivePrivateKey(index)
    // Sign transaction
    super.signTransaction(key, rawTx, pseudoCallback)
  }

  _derivePrivateKey (index) {
    let key = hdKey.fromMasterSeed(Buffer.from(this.seed, 'hex'))
    key = key.derive('m/44\'/60\'/0\'/0/' + index)
    return key.privateKey
  }
}

const seedSignerWorker = new SeedSignerWorker() // eslint-disable-line
