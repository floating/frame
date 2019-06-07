const EventEmitter = require('events')
const hot = require('./hot')
const ledger = require('./ledger')

class Signers extends EventEmitter {
  constructor () {
    super()
    this.signers = []
    hot.scan(this)
    ledger.scan(this)
  }
  add (signer) {
    if (!this.signers.find(s => s.id === signer.id)) this.signers.push(signer)
  }
  remove (signer) {
    let index = this.signers.map(s => s.id).indexOf(signer.id)
    if (index > -1) this.signers.splice(index, 1)
    signer.close()
  }
  find (f) {
    return this.signers.find(f)
  }
  filter (f) {
    return this.signers.filter(f)
  }
  list () {
    return this.signers
  }
  get (id) {
    return this.signers.find(signer => signer.id === id)
  }
  createFromPhrase (mnemonic, password, cb) {
    hot.createFromPhrase(this, mnemonic, password, cb)
  }
  unsetSigner () {
    console.log('unsetSigner')
  }
}

module.exports = new Signers()
