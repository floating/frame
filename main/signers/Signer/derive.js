const HDKey = require('hdkey')
const { publicToAddress, toChecksumAddress } = require('ethereumjs-util')

module.exports = (publicKey, chainCode, cb) => {
  try {
    const hdk = new HDKey()
    hdk.publicKey = Buffer.from(publicKey, 'hex')
    hdk.chainCode = Buffer.from(chainCode, 'hex')
    const derive = index => {
      const derivedKey = hdk.derive(`m/${index}`)
      const address = publicToAddress(derivedKey.publicKey, true)
      return toChecksumAddress(`0x${address.toString('hex')}`)
    }
    const accounts = []
    for (let i = 0; i < 100; i++) { accounts[i] = derive(i) }
    cb(null, accounts)
  } catch (e) {
    cb(e)
  }
}
