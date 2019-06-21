const { hashPersonalMessage, toBuffer, ecsign, addHexPrefix, pubToAddress, ecrecover } = require('ethereumjs-util')
const hdKey = require('ethereumjs-wallet/hdkey')
const EthTx = require('ethereumjs-tx')

const crypt = require('../../../crypt')

const decrypt = async (encryptedSeed, password) => {
  return new Promise((resolve, reject) => {
    crypt.decrypt(encryptedSeed, password, (err, seed) => {
      if (err) return reject(err)
      resolve(seed)
    })
  })
}

const signMessage = async ({ index, message, encryptedSeed, password }) => {
  // Decrypt seed
  const seed = await decrypt(encryptedSeed, password)
  // Hash message
  const hash = hashPersonalMessage(toBuffer(message))
  // Derive private key
  const pk = hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0').deriveChild(index).getWallet().getPrivateKey()
  // Sign message
  const signed = ecsign(hash, pk)
  // Return serialized signed message
  const hex = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]).toString('hex')
  return addHexPrefix(hex)
}

const signTransaction = async ({ index, rawTx, encryptedSeed, password }) => {
  // Decrypt seed
  const seed = await decrypt(encryptedSeed, password)
  // Create tranasction
  const tx = new EthTx(rawTx)
  // Derive private key
  const pk = hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0').deriveChild(index).getWallet().getPrivateKey()
  // Sign transaction
  tx.sign(pk)
  // Return serialized transaction
  return '0x' + tx.serialize().toString('hex')
}

process.on('message', async (payload) => {
  let result = null
  // Handle method 'signMessage'
  if (payload.method === 'signMessage') result = await signMessage(payload.params)
  // Handle method 'signTransaction'
  if (payload.method === 'signTransaction') result = await signTransaction(payload.params)
  // Add correlation id to response
  let response = { id: payload.id, result }
  // Send response to parent process
  process.send(response)
})
