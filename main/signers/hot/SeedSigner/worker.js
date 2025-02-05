const hdKey = require('hdkey')
const HotSignerWorker = require('../HotSigner/worker')

class SeedSignerWorker extends HotSignerWorker {
  constructor() {
    super()
    this.phrase = null
    this.seed = null
    process.on('message', (message) => this.handleMessage(message))
  }

  unlock({ encryptedPhrase, encryptedSeed, password }, pseudoCallback) {
    try {
      this.phrase = encryptedPhrase
        ? this._decrypt(encryptedPhrase, password)
        : 'The seed phrase for this signer is unknown'
      this.seed = this._decrypt(encryptedSeed, password)
      pseudoCallback(null)
    } catch (e) {
      pseudoCallback('Invalid password')
    }
  }

  getSecret({ index }, pseudoCallback) {
    pseudoCallback(null, index === null ? this.phrase : this._derivePrivateKey(index).toString('hex'))
  }

  lock(_, pseudoCallback) {
    this.phrase = null
    this.seed = null
    pseudoCallback(null)
  }

  encryptPhrase({ phrase, password }, pseudoCallback) {
    pseudoCallback(null, this._encrypt(phrase, password))
  }

  encryptSeed({ seed, password }, pseudoCallback) {
    pseudoCallback(null, this._encrypt(seed.toString('hex'), password))
  }

  signMessage({ index, message }, pseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return pseudoCallback('Signer locked')
    // Derive private key
    const key = this._derivePrivateKey(index)
    // Sign message
    super.signMessage(key, message, pseudoCallback)
  }

  signTypedData({ index, typedMessage }, pseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return pseudoCallback('Signer locked')
    // Derive private key
    const key = this._derivePrivateKey(index)
    // Sign message
    super.signTypedData(key, typedMessage, pseudoCallback)
  }

  signTransaction({ index, rawTx }, pseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return pseudoCallback('Signer locked')
    // Derive private key
    const key = this._derivePrivateKey(index)
    // Sign transaction
    super.signTransaction(key, rawTx, pseudoCallback)
  }

  _derivePrivateKey(index) {
    let key = hdKey.fromMasterSeed(Buffer.from(this.seed, 'hex'))
    key = key.derive("m/44'/60'/0'/0/" + index)
    return key.privateKey
  }
}

const seedSignerWorker = new SeedSignerWorker() // eslint-disable-line
