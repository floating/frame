const EventEmitter = require('events')

const crypt = require('../crypt')

const hot = require('./hot')

class Signers extends EventEmitter {
  constructor () {
    super()
    this.signers = {}
    hot.scan(this.signers, this)
  }
  list () {
    return Object.keys(this.signers).map(id => this.signers[id].summary())
  }
  get (id) {
    return this.signers[id]
  }
  addressesToId (addresses) {
    return crypt.stringToKey(addresses.join()).toString('hex')
  }
  createFromPhrase (mnemonic, password, cb) {
    hot.createFromPhrase(this.signers, this, mnemonic, password, cb)
  }
  update (signer) {
    this.emit('update', signer)
  }
}

module.exports = new Signers()
