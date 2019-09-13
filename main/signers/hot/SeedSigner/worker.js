const { HDNode } = require('ethers/utils')
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

  signTypedData ({ index, typedData }, pseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return pseudoCallback('Signer locked')
    // Derive private key
    const key = this._derivePrivateKey(index)
    // Sign message
    super.signTypedData(key, typedData, pseudoCallback)
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
    const privateKey = HDNode.fromSeed('0x' + this.seed)
      .derivePath(`m/44'/60'/0'/0/${index}`)
      .privateKey
      .slice(2)

    return Buffer.from(privateKey, 'hex')
  }
}

const seedSignerWorker = new SeedSignerWorker() // eslint-disable-line
