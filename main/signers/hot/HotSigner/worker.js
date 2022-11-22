const crypto = require('crypto')
const ethSigUtil = require('eth-sig-util')
const {computePreImage} = require('../../../../resources/domain/transaction')
const { serialize } = require('@ethersproject/transactions')

const {
  hashPersonalMessage,
  toBuffer,
  ecsign,
  addHexPrefix,
  pubToAddress,
  ecrecover
} = require('ethereumjs-util')
const { SigningKey } = require('ethers/lib/utils')

class HotSignerWorker {
  constructor () {
    this.token = crypto.randomBytes(32).toString('hex')
    process.send({ type: 'token', token: this.token })
  }

  handleMessage ({ id, method, params, token }) {
    // Define (pseudo) callback
    const pseudoCallback = (error, result) => {
      // Add correlation id to response
      const response = { id, error, result, type: 'rpc' }
      // Send response to parent process
      process.send(response)
    }
    // Verify token
    if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(this.token))) return pseudoCallback('Invalid token')
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

  signTypedData (key, params, pseudoCallback) {
    try {
      const signature = ethSigUtil.signTypedMessage(key, { data: params.typedData }, params.version)
      pseudoCallback(null, signature)
    } catch (e) {
      pseudoCallback(e.message)
    }
  }

  signTransaction (key, rawTx, pseudoCallback) {
    if (!rawTx.chainId) {
      console.error(`invalid chain id ${rawTx.chainId} for transaction`)
      return pseudoCallback('could not determine chain id for transaction')
    }
    const {chainId, type, from, ...payload} = rawTx
    payload['chainId'] = parseInt(chainId, 16)
    payload['type'] = parseInt(rawTx.type || '0', 16)
    const preImage = computePreImage(payload)

    const signingKey = new SigningKey(key)
    const signature = signingKey.signDigest(preImage)
    const serialized = serialize(payload, signature)

    pseudoCallback(null, addHexPrefix(serialized))
  }

  verifyAddress ({ index, address }, pseudoCallback) {
    const message = '0x' + crypto.randomBytes(32).toString('hex')
    this.signMessage({ index, message }, (err, signedMessage) => {
      // Handle signing errors
      if (err) return pseudoCallback(err)
      // Signature -> buffer
      const signature = Buffer.from(signedMessage.replace('0x', ''), 'hex')
      // Ensure correct length
      if (signature.length !== 65) return pseudoCallback(new Error('Frame verifyAddress signature has incorrect length'))
      // Verify address
      let v = signature[64]
      v = v === 0 || v === 1 ? v + 27 : v
      const r = toBuffer(signature.slice(0, 32))
      const s = toBuffer(signature.slice(32, 64))
      const hash = hashPersonalMessage(toBuffer(message))
      const verifiedAddress = '0x' + pubToAddress(ecrecover(hash, v, r, s)).toString('hex')
      // Return result
      pseudoCallback(null, verifiedAddress.toLowerCase() === address.toLowerCase())
    })
  }

  _encrypt (string, password) {
    const salt = crypto.randomBytes(16)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', this._hashPassword(password, salt), iv)
    const encrypted = Buffer.concat([cipher.update(string), cipher.final()])
    return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  _decrypt (string, password) {
    const parts = string.split(':')
    const salt = Buffer.from(parts.shift(), 'hex')
    const iv = Buffer.from(parts.shift(), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', this._hashPassword(password, salt), iv)
    const encryptedString = Buffer.from(parts.join(':'), 'hex')
    const decrypted = Buffer.concat([decipher.update(encryptedString), decipher.final()])
    return decrypted.toString()
  }

  _hashPassword (password, salt) {
    try {
      return crypto.scryptSync(password, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 36000000 })
    } catch (e) {
      console.error('Error during hashPassword', e) // TODO: Handle Error
    }
  }
}

module.exports = HotSignerWorker
