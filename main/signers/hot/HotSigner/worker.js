const crypto = require('crypto')
const bcrypt = require('bcrypt')
const { hashPersonalMessage, toBuffer, ecsign, addHexPrefix, pubToAddress, ecrecover } = require('ethereumjs-util')
const EthTx = require('ethereumjs-tx')

class HotSignerWorker {
  constructor () {
    this.token = crypto.randomBytes(32).toString('hex')
    process.send({ type: 'token', token: this.token })
  }

  handleMessage ({ id, method, params, token }) {
    // Define (pseudo) callback
    const pseudoCallback = (error, result) => {
      // Add correlation id to response
      let response = { id, error, result, type: 'rpc' }
      // Send response to parent process
      process.send(response)
    }
    // Verify token
    if (token !== this.token) return pseudoCallback('Invalid token')
    // If method exists -> execute
    if (this[method]) return this[method](params, pseudoCallback)
    // Else return error
    pseudoCallback(`Invalid method: '${method}'`)
  }

  signMessage (key, message, pseudoCallback) {
    // Hash message
    const hash = hashPersonalMessage(toBuffer(message))
    // Sign message
    const signed = ecsign(hash, key)
    // Return serialized signed message
    const hex = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]).toString('hex')
    pseudoCallback(null, addHexPrefix(hex))
  }

  signTransaction (key, rawTx, pseudoCallback) {
    // Create tranasction
    const tx = new EthTx(rawTx)
    // Sign transaction
    tx.sign(key)
    // Return serialized transaction
    const serialized = tx.serialize().toString('hex')
    pseudoCallback(null, addHexPrefix(serialized))
  }

  verifyAddress ({ index, address }, pseudoCallback) {
    const message = crypto.randomBytes(32).toString('hex')
    this.signMessage({ index, message }, (err, signedMessage) => {
      // Handle signing errors
      if (err) return pseudoCallback(err)
      // Signature -> buffer
      const signature = Buffer.from(signedMessage.replace('0x', ''), 'hex')
      // Ensure correct length
      if (signature.length !== 65) throw new Error(`Frame verifyAddress signature has incorrect length`)
      // Verify address
      let v = signature[64]
      v = v === 0 || v === 1 ? v + 27 : v
      let r = toBuffer(signature.slice(0, 32))
      let s = toBuffer(signature.slice(32, 64))
      const hash = hashPersonalMessage(toBuffer(message))
      const verifiedAddress = '0x' + pubToAddress(ecrecover(hash, v, r, s)).toString('hex')
      // Return result
      pseudoCallback(null, verifiedAddress.toLowerCase() === address.toLowerCase())
    })
  }

  _encrypt (string, password) {
    const salt = bcrypt.genSaltSync(10)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', this._hashPassword(password, salt), iv)
    const encrypted = Buffer.concat([cipher.update(string), cipher.final()])
    return salt + ':' + iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  _decrypt (string, password) {
    const parts = string.split(':')
    const salt = parts.shift()
    const iv = Buffer.from(parts.shift(), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', this._hashPassword(password, salt), iv)
    const encryptedString = Buffer.from(parts.join(':'), 'hex')
    const decrypted = Buffer.concat([decipher.update(encryptedString), decipher.final()])
    return decrypted.toString()
  }

  _hashPassword (password, salt) {
    const hash = crypto.createHash('sha512').update(bcrypt.hashSync(password, salt))
    return Buffer.from(hash.digest('hex').substring(0, 32))
  }
}

module.exports = HotSignerWorker
