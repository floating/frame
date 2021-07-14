const EventEmitter = require('events')
const log = require('electron-log')
const crypto = require('crypto')

const hot = require('./hot')
const ledger = require('./ledger')
const trezorConnect = require('./trezor-connect')
const lattice = require('./lattice')

const store = require('../store')

class Signers extends EventEmitter {
  constructor () {
    super()
    this.signers = []
    // this.lattice = lattice(this)
    this.scans = {
      lattice: lattice.scan(this),
      hot: hot.scan(this),
      ledger: ledger.scan(this),
      trezor: trezorConnect.scan(this)
    }
  }

  trezorPin (id, pin, cb) {
    const signer = this.get(id)
    if (signer && signer.setPin) {
      signer.setPin(pin)
      cb(null, { status: 'ok' })
    } else {
      cb(new Error('Set pin not avaliable...'))
    }
  }

  trezorPhrase (id, phrase, cb) {
    const signer = this.get(id)
    if (signer && signer.trezorPhrase) {
      signer.trezorPhrase(phrase || '')
      cb(null, { status: 'ok' })
    } else {
      cb(new Error('Set phrase not avaliable...'))
    }
  }

  async latticePair (id, pin) {
    try {
      const signer = this.get(id)
      if (signer && signer.setPair) {
        try {
          const result = await signer.setPair(pin)
          return result
        } catch (err) {
          log.error('latticePair Error', err)
          return new Error(err)
        }
      } else {
        return new Error('Could not pair')
      }
    } catch (err) {
      return new Error(err)
    }
  }

  async createLattice (deviceId) {
    if (deviceId) {
      store.updateLattice(deviceId, { 
        deviceId, 
        baseUrl: 'https://signing.gridpl.us',
        endpointMode: 'default',
        suffix: '',
        privKey: crypto.randomBytes(32).toString('hex')  
      })    
      return { id: 'lattice-' + deviceId}
    } else {
      throw new Error('No Device ID')
    }
  }


  async latticeConnect (connectOpts) {
    const signer = lattice(this)
    if (signer && signer.open) {
      try {
        const response = await signer.open(connectOpts)

        return response
      } catch (err) {
        throw new Error('Could not connect to lattice', err)
      }
    } else {
      return new Error('Lattice, no signer or signer not open')
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

  reload (id) {
    const index = this.signers.map(s => s.id).indexOf(id)
    if (index > -1) {
      const signer = this.signers[index]
      let { type } = signer
      signer.close()
      this.signers.splice(index, 1)
      if (type === 'ring' || type === 'seed') type = 'hot'
      if (this.scans[type] && typeof this.scans[type] === 'function') this.scans[type]()
    }
  }

  // removeAllSigners () {
  //   this.signers.forEach(signer => {
  //     signer.close()
  //     if (signer.delete) signer.delete()
  //   })
  //   this.signers = []
  //   const { app } = require('electron')
  //   const fs = require('fs')
  //   const path = require('path')
  //   const USER_DATA = app ? app.getPath('userData') : './test/.userData'
  //   const SIGNERS_PATH = path.resolve(USER_DATA, 'signers')
  //   const directory = SIGNERS_PATH
  //   fs.readdir(directory, (err, files) => {
  //     if (err) throw err
  //     for (const file of files) {
  //       fs.unlink(path.join(directory, file), err => {
  //         if (err) throw err
  //       })
  //     }
  //   })
  // }

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
