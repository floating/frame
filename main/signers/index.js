const EventEmitter = require('events')
const hot = require('./hot')
const ledger = require('./ledger')
const trezorConnect = require('./trezor-connect')

class Signers extends EventEmitter {
  constructor () {
    super()
    this.signers = []
    hot.scan(this)
    ledger.scan(this)
    trezorConnect.scan(this)
  }
  add (signer) {
    if (!this.signers.find(s => s.id === signer.id)) this.signers.push(signer)
  }
  remove (id) {
    let index = this.signers.map(s => s.id).indexOf(id)
    if (index > -1) {
      this.signers[index].close()
      this.signers.splice(index, 1)
    }
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
  unlock (id, password) {
    let signer = this.signers.find(s => s.id === id)
    if (signer && signer.unlock) {
      signer.unlock(password)
    } else {
      console.error('Signer not unlockable via password')
    }
  }
  unsetSigner () {
    console.log('unsetSigner')
  }
  lock (id) {
    let signer = this.get(id)
    if (signer && signer.lock) signer.lock()
  }
}

module.exports = new Signers()
