const EventEmitter = require('events')
const hdKey = require('ethereumjs-wallet/hdkey')
const bip39 = require('bip39')

const crypt = require('../crypt')
const store = require('../store')

class Signers extends EventEmitter {
  constructor () {
    super()
    // Spin up all monitors
    this.signers = store('main._signers') // new Signer()
  }
  get (id) {
    return this.signers[id]
  }
  addressesToId (addresses) {
    return crypt.stringToKey(addresses.join()).toString('hex')
  }
  newPhrase () {
    return bip39.generateMnemonic()
  }
  seedToAddresses (seed) {
    const wallet = hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0')
    const addresses = []
    for (var i = 0; i < 100; i++) { addresses.push(wallet.deriveChild(i).getWallet().getChecksumAddressString()) }
    return addresses
  }
  createFromSeed (seed, password, cb) {
    if (!seed) return cb(new Error('Seed required to create local signer'))
    if (!password) return cb(new Error('Password required to create local signer'))
    const addresses = this.seedToAddresses(seed)
    const id = this.addressesToId(addresses)
    if (store('main', '_signers', id)) return cb(new Error('Signer already exists'))
    crypt.encrypt(seed.toString('hex'), password, (err, encryptedSeed) => {
      if (err) return cb(err)
      const signer = { id, addresses, type: 'local', seed: encryptedSeed }
      store.newSigner(signer)
      cb(null, signer)
    })
  }
  createFromPhrase (phrase, password, cb) {
    if (!bip39.validateMnemonic(phrase)) return cb(new Error('Invalid mnemonic phrase'))
    bip39.mnemonicToSeed(phrase).then(seed => this.createFromSeed(seed, password, cb)).catch(err => cb(err))
  }
}

module.exports = new Signers()
