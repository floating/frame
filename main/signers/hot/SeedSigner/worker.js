const hdKey = require('ethereumjs-wallet/hdkey')
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

  signMessage ({ index, message }, pseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return pseudoCallback('Signer locked')
    // Derive private key
    const key = this._derivePrivateKey(index)
    // Sign message
    super.signMessage(key, message, pseudoCallback)
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
    return hdKey.fromMasterSeed(Buffer.from(this.seed, 'hex'))
      .derivePath('m/44\'/60\'/0\'/0')
      .deriveChild(index)
      .getWallet()
      .getPrivateKey()
  }
}

const seedSignerWorker = new SeedSignerWorker()
