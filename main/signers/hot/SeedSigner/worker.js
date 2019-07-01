const { hashPersonalMessage, toBuffer, ecsign, addHexPrefix, pubToAddress, ecrecover } = require('ethereumjs-util')
const hdKey = require('ethereumjs-wallet/hdkey')
const EthTx = require('ethereumjs-tx')
const uuid = require('uuid/v4')

const crypt = require('../../../crypt')

let seed = null

const unlockAccount = ({ encryptedSeed, password }, pseudoCallback) => {
  crypt.decrypt(encryptedSeed, password, (err, decryptedSeed) => {
    if (err) pseudoCallback('Invalid password')
    else {
      seed = decryptedSeed
      pseudoCallback(null, 'ok')
    }
  })
}

const lockAccount = (pseudoCallback) => {
  seed = null
  pseudoCallback(null)
}

const signMessage = ({ index, message }, pseudoCallback) => {
  // Make sure account is unlocked
  if (!seed) return pseudoCallback('Signer locked')
  // Hash message
  const hash = hashPersonalMessage(toBuffer(message))
  // Derive private key
  const pk = hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0').deriveChild(index).getWallet().getPrivateKey()
  // Sign message
  const signed = ecsign(hash, pk)
  // Return serialized signed message
  const hex = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]).toString('hex')
  pseudoCallback(null, addHexPrefix(hex))
}

const signTransaction = ({ index, rawTx }, pseudoCallback) => {
  // Make sure account is unlocked
  if (!seed) return pseudoCallback('Signer locked')
  // Create tranasction
  const tx = new EthTx(rawTx)
  // Derive private key
  const pk = hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0').deriveChild(index).getWallet().getPrivateKey()
  // Sign transaction
  tx.sign(pk)
  // Return serialized transaction
  pseudoCallback(null, '0x' + tx.serialize().toString('hex'))
}

const verifyAddress = ({ index, address }, pseudoCallback) => {
  // Make sure account is unlocked
  if (!seed) return pseudoCallback('Signer locked')
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
  if (method === 'unlockAccount') return unlockAccount(params, pseudoCallback)
  // Handle method 'unlockAccount'
  if (method === 'lockAccount') return lockAccount(pseudoCallback)
  // Handle method 'signMessage'
  if (method === 'signMessage') return signMessage(params, pseudoCallback)
  // Handle method 'signTransaction'
  if (method === 'signTransaction') return signTransaction(params, pseudoCallback)
  // Handle method 'verifyAddress'
  if (method === 'verifyAddress') return verifyAddress(params, pseudoCallback)
  // Handle invalid method
  else pseudoCallback(`Invalid method: '${method}'`)
})
