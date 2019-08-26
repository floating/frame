const EventEmitter = require('events')
const log = require('electron-log')

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

  trezorPin (id, pin, cb) {
    let signer = this.get(id)
    if (signer && signer.setPin) {
      signer.setPin(pin)
      cb(null, { status: 'ok' })
    } else {
      cb(new Error('Set pin not avaliable...'))
    }
  }

  add (signer) {
    if (!this.signers.find(s => s.id === signer.id)) this.signers.push(signer)
  }

  remove (id) {
    const index = this.signers.map(s => s.id).indexOf(id)
    if (index > -1) {
      const signer = this.signers[index]
      signer.close()
      // If hot signer -> erase from disk
      if (signer.delete) signer.delete()
      this.signers.splice(index, 1)
    }
  }

  removeAllSigners () {
    this.signers.forEach(signer => {
      signer.close()
      if (signer.delete) signer.delete()
    })
    this.signers = []
    const { app } = require('electron')
    const fs = require('fs')
    const path = require('path')
    const USER_DATA = app ? app.getPath('userData') : './test/.userData'
    const SIGNERS_PATH = path.resolve(USER_DATA, 'signers')
    const directory = SIGNERS_PATH
    fs.readdir(directory, (err, files) => {
      if (err) throw err
      for (const file of files) {
        fs.unlink(path.join(directory, file), err => {
          if (err) throw err
        })
      }
    })
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

  createFromPrivateKey (privateKey, password, cb) {
    hot.createFromPrivateKey(this, privateKey, password, cb)
  }

  createFromKeystore (keystore, keystorePassword, password, cb) {
    hot.createFromKeystore(this, keystore, keystorePassword, password, cb)
  }

  addPrivateKey (id, privateKey, password, cb) {
    // Get signer
    const signer = this.get(id)
    // Make sure signer is of type 'ring'
    if (!signer.type === 'ring') return cb(new Error('Private keys can only be added to ring signers'))
    // Add private key
    signer.addPrivateKey(privateKey, password, cb)
  }

  removePrivateKey (id, index, password, cb) {
    // Get signer
    const signer = this.get(id)
    // Make sure signer is of type 'ring'
    if (!signer.type === 'ring') return cb(new Error('Private keys can only be removed from ring signers'))
    // Add keystore
    signer.removePrivateKey(index, password, cb)
  }

  addKeystore (id, keystore, keystorePassword, password, cb) {
    // Get signer
    const signer = this.get(id)
    // Make sure signer is of type 'ring'
    if (!signer.type === 'ring') return cb(new Error('Keystores can only be used with ring signers'))
    // Add keystore
    signer.addKeystore(keystore, keystorePassword, password, cb)
  }

  lock (id, cb) {
    const signer = this.get(id)
    if (signer && signer.lock) signer.lock(cb)
  }

  unlock (id, password, cb) {
    const signer = this.signers.find(s => s.id === id)
    if (signer && signer.unlock) {
      signer.unlock(password, cb)
    } else {
      log.error('Signer not unlockable via password, no unlock method')
    }
  }

  unsetSigner () {
    log.info('unsetSigner')
  }
}

module.exports = new Signers()
