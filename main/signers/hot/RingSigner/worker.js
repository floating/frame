const { hashPersonalMessage, toBuffer, ecsign, addHexPrefix, pubToAddress, ecrecover } = require('ethereumjs-util')
const EthTx = require('ethereumjs-tx')
const uuid = require('uuid/v4')

const crypt = require('../../../crypt')

let unlockedKeys = null

// TODO: Refactor logic common for all hot signer workers into one module

const decrypt = (encryptedKeys, password) => {
  return new Promise((resolve, reject) => {
    crypt.decrypt(encryptedKeys, password, (err, keyString) => {
      if (err) return reject(err)
      else resolve(keyString.split(':'))
    })
  })
}

const encrypt = (keys, password) => {
  const keyString = keys.join(':')
  return new Promise((resolve, reject) => {
    crypt.encrypt(keyString, password, (err, encryptedKeys) => {
      if (err) return reject(err)
      else resolve(encryptedKeys)
    })
  })
}

const unlock = async ({ encryptedKeys, password }, pseudoCallback) => {
  try {
    unlockedKeys = await decrypt(encryptedKeys, password)
    pseudoCallback(null, 'ok')
  } catch (err) {
    pseudoCallback('Invalid password')
  }
}

const lock = (pseudoCallback) => {
  unlockedKeys = null
  pseudoCallback(null)
}

const addKey = async ({ encryptedKeys, key, password }, pseudoCallback) => {
  let keys

  // If signer already has encrypted keys -> decrypt them and add new key
  if (encryptedKeys) {
    keys = await decrypt(encryptedKeys, password)
    keys.push(key)
  } else {
    keys = [key]
  }

  // Encrypt and return keys
  encryptedKeys = await encrypt(keys, password)
  pseudoCallback(null, encryptedKeys)
}

const removeKey = async ({ encryptedKeys, index, password }, pseudoCallback) => {
  if (!encryptedKeys) return pseudoCallback('Signer does not have any keys')
  // Get list of decrypted keys
  let keys = await decrypt(encryptedKeys, password)
  // Remove key from list
  keys = keys.filter((key) => key !== keys[index])
  // Return encrypted list
  pseudoCallback(null, await encrypt(keys, password))
}

const signMessage = ({ index, message }, pseudoCallback) => {
  // Make sure account is unlocked
  if (!unlockedKeys) return pseudoCallback('Signer locked')
  // Hash message
  const hash = hashPersonalMessage(toBuffer(message))
  // Sign message
  const signed = ecsign(hash, unlockedKeys[index])
  // Return serialized signed message
  const hex = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]).toString('hex')
  pseudoCallback(null, addHexPrefix(hex))
}

const signTransaction = ({ index, rawTx }, pseudoCallback) => {
  // Make sure account is unlocked
  if (!unlockedKeys) return pseudoCallback('Signer locked')
  // Create tranasction
  const tx = new EthTx(rawTx)
  // Sign transaction
  tx.sign(unlockedKeys[index])
  // Return serialized transaction
  pseudoCallback(null, '0x' + tx.serialize().toString('hex'))
}

const verifyAddress = ({ index, address }, pseudoCallback) => {
  // Make sure account is unlocked
  if (!unlockedKeys) return pseudoCallback('Signer locked')
  // Construct message
  const message = uuid()
  // Sign message
  signMessage({ index, message }, (err, signed) => {
    if (err) return pseudoCallback(err)
    // Get signature buffer
    const signature = Buffer.from(signed.replace('0x', ''), 'hex')
    // Check for correct length
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

process.on('message', ({ id, method, params }) => {
  // Define (pseudo) callback
  const pseudoCallback = (error, result) => {
    // Add correlation id to response
    let response = { id, error, result }
    // Send response to parent process
    process.send(response)
  }
  // Handle method 'unlockAccount'
  if (method === 'unlock') return unlock(params, pseudoCallback)
  // Handle method 'unlockAccount'
  if (method === 'lock') return lock(pseudoCallback)
  // Handle method 'signMessage'
  if (method === 'signMessage') return signMessage(params, pseudoCallback)
  // Handle method 'signTransaction'
  if (method === 'signTransaction') return signTransaction(params, pseudoCallback)
  // Handle method 'verifyAddress'
  if (method === 'verifyAddress') return verifyAddress(params, pseudoCallback)
  // Handle method 'addKey'
  if (method === 'addKey') return addKey(params, pseudoCallback)
  // Handle method 'removeKey'
  if (method === 'removeKey') return removeKey(params, pseudoCallback)
  // Handle invalid method
  else pseudoCallback(`Invalid method: '${method}'`)
})

module.exports = { encrypt, decrypt, addKey, removeKey, unlock }
