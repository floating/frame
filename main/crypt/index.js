const crypto = require('crypto')

const stringToKey = pass => {
  const hash = crypto.createHash('sha256').update(pass)
  return Buffer.from(hash.digest('hex').substring(0, 32))
}

const encrypt = (string, pass, cb) => {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', stringToKey(pass), iv)
    const encrypted = Buffer.concat([cipher.update(string), cipher.final()])
    cb(null, iv.toString('hex') + ':' + encrypted.toString('hex'))
  } catch (e) { cb(e) }
}

const decrypt = (string, pass, cb) => {
  try {
    const parts = string.split(':')
    const iv = Buffer.from(parts.shift(), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', stringToKey(pass), iv)
    const encryptedString = Buffer.from(parts.join(':'), 'hex')
    const decrypted = Buffer.concat([decipher.update(encryptedString), decipher.final()])
    cb(null, decrypted.toString())
  } catch (e) { cb(e) }
}

module.exports = { encrypt, decrypt, stringToKey }
