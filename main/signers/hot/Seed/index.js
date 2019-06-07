const EthTx = require('ethereumjs-tx')
const { hashPersonalMessage, toBuffer, ecsign, addHexPrefix } = require('ethereumjs-util')
const log = require('electron-log')

const crypt = require('../../../crypt')
const store = require('../../../store')
const Signer = require('../../Signer')
const hdKey = require('ethereumjs-wallet/hdkey')

// const addressSigner = (seed, index) => {
//   return hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0').deriveChild(index).getWallet().getPrivateKey()
// }

class Seed extends Signer {
  constructor (signer) {
    super()
    log.info('Creating seed signer instance')
    this.type = signer.type
    this.addresses = signer.addresses
    this.seed = signer.seed
    this.unlockedSeed = ''
    this.unlock('frame')
    this.update()
  }
  save () {

  }
  unlock (password) {
    crypt.decrypt(this.seed, password, (err, seed) => {
      if (err) return console.log(err)
      this.unlockedSeed = seed
    })
  }
  // Standard Methods
  signMessage (message, cb) {
    const hash = hashPersonalMessage(toBuffer(message))
    const signed = ecsign(hash, this.privateKey)
    const hex = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]).toString('hex')
    cb(null, addHexPrefix(hex))
  }
  signTransaction (index, rawTx, cb) {
    if (!this.unlockedSeed) return cb(new Error('Account locked'))
    const tx = new EthTx(rawTx)
    // const addy = hdKey.fromMasterSeed(Buffer.from(this.unlockedSeed, 'hex')).derivePath('m/44\'/60\'/0\'/0').deriveChild(index).getWallet().getChecksumAddressString()
    const pk = hdKey.fromMasterSeed(Buffer.from(this.unlockedSeed, 'hex')).derivePath('m/44\'/60\'/0\'/0').deriveChild(index).getWallet().getPrivateKey()
    tx.sign(pk)
    setTimeout(() => cb(null, '0x' + tx.serialize().toString('hex')), 1000) // Response delay for development
  }
  update () {
    let id = this.addressesId()
    if (this.id !== id) { // Singer address representation changed
      store.removeSigner(this.id)
      this.id = id
    }
    store.updateSigner(this.summary())
  }
}

module.exports = Seed
