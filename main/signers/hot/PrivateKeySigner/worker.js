const { hashPersonalMessage, toBuffer, ecsign, addHexPrefix, pubToAddress, ecrecover } = require('ethereumjs-util')
const hdKey = require('ethereumjs-wallet/hdkey')
const EthTx = require('ethereumjs-tx')
const uuid = require('uuid/v4')

const crypt = require('../../../crypt')

let key = ''

const unlockAccount = async ({ encryptedKey, password }, pseudoCallback) => {
  crypt.decrypt(encryptedKey, password, (err, decryptedKey) => {
    if (err) pseudoCallback('Invalid password')
    else {
      key = decryptedKey
      pseudoCallback(null, 'ok')
    }
  })
}

const lockAccount = async (pseudoCallback) => {
  key = null
  pseudoCallback()
}

const signMessage = async ({ message }, pseudoCallback) => {
  // Make sure account is unlocked
  if (!key) return pseudoCallback('Account locked')
  // Hash message
  const hash = hashPersonalMessage(toBuffer(message))
  // Sign message
  const signed = ecsign(hash, pk)
  // Return serialized signed message
  const hex = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]).toString('hex')
  pseudoCallback(null, addHexPrefix(hex))
}

const signTransaction = async ({ rawTx }, pseudoCallback) => {
  // Make sure account is unlocked
  if (!key) return pseudoCallback('Account locked')
  // Create tranasction
  const tx = new EthTx(rawTx)
  // Sign transaction
  tx.sign(key)
  // Return serialized transaction
  pseudoCallback(null, '0x' + tx.serialize().toString('hex'))
}

process.on('message', async ({ id, method, params }) => {
  // Define (pseudo) callback
  const pseudoCallback = (error, result) => {
    // Add correlation id to response
    let response = { id, error, result }
    // Send response to parent process
    process.send(response)
  }
  // Handle method 'unlockAccount'
  if (method === 'unlockAccount') return unlockAccount(params, pseudoCallback)
  // Handle method 'unlockAccount'
  if (method === 'lockAccount') return lockAccount(pseudoCallback)
  // Handle method 'signMessage'
  if (method === 'signMessage') return signMessage(params, pseudoCallback)
  // Handle method 'signTransaction'
  if (method === 'signTransaction') return signTransaction(params, pseudoCallback)
  // Handle invalid method
  else pseudoCallback(`Invalid method: '${method}'`)
})
