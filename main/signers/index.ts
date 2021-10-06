// @ts-nocheck

const EventEmitter = require('events')
import log from 'electron-log'
import crypto from 'crypto'

import Signer from './signer'
import { SignerAdapter } from './adapters'

import hot from './hot'
import LedgerAdapter from './ledger/adapter'
import trezorConnect  from './trezor-connect'
import lattice from './lattice'

import store from '../store'

const registeredAdapters = [
  new LedgerAdapter()
]

interface AdapterSpec {
  [key: string]: {
    adapter: SignerAdapter,
    listeners: {
      event: string,
      handler: (p: any) => void
    }[]
  }
}

class Signers extends EventEmitter {
  private adapters: AdapterSpec;
  private signers: { [key: string]: Signer };

  constructor () {
    super()

    this.signers = {}
    this.adapters = {}

    // TODO: convert these scans to adapters
    this.scans = {
      lattice: lattice.scan(this),
      hot: hot.scan(this),
      trezor: trezorConnect.scan(this)
    }

    registeredAdapters.forEach(this.addAdapter.bind(this))
  }

  addAdapter (adapter: SignerAdapter) {
    const addFn = this.add.bind(this)
    const removeFn = id => this.remove(id, false)
    const updateFn = this.update.bind(this)

    adapter.on('add', addFn)
    adapter.on('remove', removeFn)
    adapter.on('update', updateFn)

    adapter.open()

    this.adapters[adapter.adapterType] = {
      adapter,
      listeners: [
        {
          event: 'add',
          handler: addFn
        },
        {
          event: 'remove',
          handler: removeFn
        },
        {
          event: 'update',
          handler: updateFn
        }
      ]
    }
  }

  removeAdapter (adapter: SignerAdapter) {
    const adapterSpec = this.adapters[adapter.adapterType]

    adapterSpec.listeners.forEach(listener => {
      adapter.removeListener(listener.event, listener.handler)
    })

    delete this.adapter[adapter.adapterType]
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

  exists (id) {
    return id in this.signers
  }

  add (signer: Signer) {
    const id = signer.id

    if (!(id in this.signers)) {
      this.signers[id] = signer

      store.newSigner(signer.summary())
    }
  }

  remove (id: string, close = true) {
    if (id in this.signers) {
      store.removeSigner(id)

      const signer = this.signers[id]

      // for backwards compatibility, when all scans are converted to adapters
      // they should close the signers before emitting the close event
      if (close) signer.close()
      signer.delete()

      delete this.signers[id]
    }
  }

  update (signer: Signer) {
    const id = signer.id

    if (id in this.signers) {
      this.signers[id] = signer

      store.updateSigner(signer.summary())
    } else {
      this.add(id, signer)
    }
  }

  reload (id) {
    const signer = this.signers[id]
    
    if (signer) {
      let { type } = signer

      signer.close()
      delete this.signers[id]

      if (type === 'ring' || type === 'seed') type = 'hot'
      if (this.scans[type] && typeof this.scans[type] === 'function') this.scans[type]()
    }
  }

  find (f) {
    return Object.values(this.signers).find(f)
  }

  filter (f) {
    return Object.values(this.signers).filter(f)
  }

  list () {
    return Object.values(this.signers)
  }

  get (id) {
    return this.signers[id]
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
    const signer = this.signers[id]
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