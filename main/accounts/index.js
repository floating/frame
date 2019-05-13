// const EventEmitter = require('events')
// bip39.generateMnemonic()

const hdKey = require('ethereumjs-wallet/hdkey')
const bip39 = require('bip39')

const crypt = require('../crypt')

const hdAccount = (phrase, password, cb) => {
  if (!bip39.validateMnemonic(phrase)) return cb(new Error('Invalid mnemonic phrase'))
  bip39.mnemonicToSeed(phrase).then(seed => {
    const wallet = hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0')
    const addresses = []
    for (var i = 0; i < 100; i++) { addresses.push(wallet.deriveChild(i).getWallet().getChecksumAddressString()) }
    crypt.encrypt(seed.toString('hex'), password, (err, encryptedSeed) => {
      if (err) return cb(err)
      crypt.encrypt(phrase, password, (err, encryptedPhrase) => {
        if (err) return cb(err)
        const account = { type: 'hot', addresses, seed: encryptedSeed, phrase: encryptedPhrase }
        cb(null, account)
      })
    })
  }).catch(err => cb(err))
}

const addressSigner = (seed, index) => {
  return hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0').deriveChild(index).getWallet()
}

const mnemonic = 'duck daring trouble employ million bamboo stock seed refuse example glimpse flame'
const password = 'frame'

hdAccount(mnemonic, password, (err, account) => {
  if (err) return console.log(err)
  console.log('Create account')
  crypt.decrypt(account.seed, password, (err, seed) => {
    if (err) return console.log(err)
    console.log('    Mached root address:', addressSigner(seed, 0).getChecksumAddressString() === account.addresses[0])
  })
  crypt.decrypt(account.phrase, password, (err, phrase) => {
    if (err) return console.log(err)
    console.log('    Decrypted phrase from account:', mnemonic === phrase)
  })
})
