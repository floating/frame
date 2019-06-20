const hdKey = require('ethereumjs-wallet/hdkey')
const bip39 = require('bip39')

const crypt = require('../../crypt')

const api = {
  newPhrase: (cb) => {
    cb(null, bip39.generateMnemonic())
  },
  seedToAddresses: (seed) => {
    const wallet = hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0')
    const addresses = []
    for (var i = 0; i < 100; i++) { addresses.push(wallet.deriveChild(i).getWallet().getChecksumAddressString()) }
    return addresses
  },
  fromSeed: (seed, password, cb) => {
    if (!seed) return cb(new Error('Seed required to create local signer'))
    if (!password) return cb(new Error('Password required to create local signer'))
    const addresses = api.seedToAddresses(seed)
    crypt.encrypt(seed.toString('hex'), password, (err, encryptedSeed) => {
      if (err) return cb(err)
      cb(null, { addresses, type: 'hot', seed: encryptedSeed })
    })
  },
  fromPhrase: (phrase, password, cb) => {
    if (!bip39.validateMnemonic(phrase)) return cb(new Error('Invalid mnemonic phrase')) // Add option to continue anyway
    bip39.mnemonicToSeed(phrase).then(seed => {
      api.fromSeed(seed, password, cb)
    }).catch(err => cb(err))
  }
}

module.exports = api
