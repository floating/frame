const HotSignerWorker = require('../HotSigner/worker')

class RingSignerWorker extends HotSignerWorker {
  constructor () {
    super()
    this.keys = null
    process.on('message', (message) => this.handleMessage(message))
  }

  unlock ({ encryptedKeys, password }, pseudoCallback) {
    try {
      this.keys = this._decrypt(encryptedKeys, password)
        .split(':')
        .map((key) => Buffer.from(key, 'hex'))
      pseudoCallback(null)
    } catch (e) {
      pseudoCallback('Invalid password')
    }
  }

  lock (_, pseudoCallback) {
    this.keys = null
    pseudoCallback(null)
  }

  addKey ({ encryptedKeys, key, password }, pseudoCallback) {
    let keys
    // If signer already has encrypted keys -> decrypt them and add new key
    if (encryptedKeys) keys = [...this._decryptKeys(encryptedKeys, password), key]
    // Else -> generate new list of keys
    else keys = [key]
    // Encrypt and return list of keys
    encryptedKeys = this._encryptKeys(keys, password)
    pseudoCallback(null, encryptedKeys)
  }

  removeKey ({ encryptedKeys, index, password }, pseudoCallback) {
    if (!encryptedKeys) return pseudoCallback('Signer does not have any keys')
    // Get list of decrypted keys
    let keys = this._decryptKeys(encryptedKeys, password)
    // Remove key from list
    keys = keys.filter((key) => key !== keys[index])
    // Return encrypted list (or null if empty)
    const result = keys.length > 0 ? this._encryptKeys(keys, password) : null
    pseudoCallback(null, result)
  }

  signMessage ({ index, message }, pseudoCallback) {
    // Make sure signer is unlocked
    if (!this.keys) return pseudoCallback('Signer locked')
    // Sign message
    super.signMessage(this.keys[index], message, pseudoCallback)
  }

  signTypedData ({ index, typedMessage }, pseudoCallback) {
    // Make sure signer is unlocked
    if (!this.keys) return pseudoCallback('Signer locked')
    // Sign Typed Data
    super.signTypedData({ key: this.keys[index], typedMessage }, pseudoCallback)
  }
  
  signTransaction ({ index, rawTx }, pseudoCallback) {
    // Make sure signer is unlocked
    if (!this.keys) return pseudoCallback('Signer locked')
    // Sign transaction
    super.signTransaction(this.keys[index], rawTx, pseudoCallback)
  }

  _decryptKeys (encryptedKeys, password) {
    if (!encryptedKeys) return null
    const keyString = this._decrypt(encryptedKeys, password)
    return keyString.split(':')
  }

  _encryptKeys (keys, password) {
    const keyString = keys.join(':')
    return this._encrypt(keyString, password)
  }
}

const ringSignerWorker = new RingSignerWorker() // eslint-disable-line
