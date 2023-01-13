import EventEmitter from 'events'
import log from 'electron-log'

import Signer from './Signer'
import { SignerAdapter } from './adapters'

import LedgerAdapter from './ledger/adapter'
import TrezorAdapter from './trezor/adapter'
import LatticeAdapter from './lattice/adapter'

import hot from './hot'
import RingSigner from './hot/RingSigner'
import HotSigner from './hot/HotSigner'

import store from '../store'

const registeredAdapters = [new LedgerAdapter(), new TrezorAdapter(), new LatticeAdapter()]

interface AdapterSpec {
  [key: string]: {
    adapter: SignerAdapter
    listeners: {
      event: string
      handler: (p: any) => void
    }[]
  }
}

type Keystore = string | { version: number }

class Signers extends EventEmitter {
  private adapters: AdapterSpec
  private scans: { [key: string]: any }

  private signers: { [id: string]: Signer }

  constructor() {
    super()

    this.signers = {}
    this.adapters = {}

    // TODO: convert these scans to adapters
    this.scans = {
      hot: hot.scan(this)
    }

    registeredAdapters.forEach(this.addAdapter.bind(this))
  }

  close() {
    registeredAdapters.forEach((a) => a.close())
  }

  addAdapter(adapter: SignerAdapter) {
    const addFn = this.add.bind(this)
    const removeFn = this.remove.bind(this)
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

  removeAdapter(adapter: SignerAdapter) {
    const adapterSpec = this.adapters[adapter.adapterType]

    adapterSpec.listeners.forEach((listener) => {
      adapter.removeListener(listener.event, listener.handler)
    })

    delete this.adapters[adapter.adapterType]
  }

  exists(id: string) {
    return id in this.signers
  }

  add(signer: Signer) {
    const id = signer.id

    if (!(id in this.signers)) {
      this.signers[id] = signer

      store.newSigner(signer.summary())
    }
  }

  remove(id: string) {
    const signer = this.signers[id]

    if (signer) {
      delete this.signers[id]
      store.removeSigner(id)

      const type = signer.type === 'ring' || signer.type === 'seed' ? 'hot' : signer.type

      if (type in this.adapters) {
        this.adapters[type].adapter.remove(signer)
      } else {
        // backwards compatibility
        signer.close()
        signer.delete()
      }
    }
  }

  update(signer: Signer) {
    const id = signer.id

    if (id in this.signers) {
      this.signers[id] = signer

      store.updateSigner(signer.summary())
    } else {
      this.add(signer)
    }
  }

  reload(id: string) {
    const signer = this.signers[id]

    if (signer) {
      const type = signer.type === 'ring' || signer.type === 'seed' ? 'hot' : signer.type

      if (this.scans[type] && typeof this.scans[type] === 'function') {
        signer.close()
        delete this.signers[id]

        this.scans[type]()
      } else if (type in this.adapters) {
        this.adapters[type].adapter.reload(signer)
      }
    }
  }

  get(id: string) {
    return this.signers[id]
  }

  createFromPhrase(mnemonic: string, password: string, cb: Callback<Signer>) {
    hot.createFromPhrase(this, mnemonic, password, cb)
  }

  createFromPrivateKey(privateKey: string, password: string, cb: Callback<Signer>) {
    hot.createFromPrivateKey(this, privateKey, password, cb)
  }

  createFromKeystore(keystore: Keystore, keystorePassword: string, password: string, cb: Callback<Signer>) {
    hot.createFromKeystore(this, keystore, keystorePassword, password, cb)
  }

  addPrivateKey(id: string, privateKey: string, password: string, cb: Callback<Signer>) {
    // Get signer
    const signer = this.get(id)
    // Make sure signer is of type 'ring'
    if (signer.type !== 'ring') {
      return cb(new Error('Private keys can only be added to ring signers'), undefined)
    }

    // Add private key
    (signer as RingSigner).addPrivateKey(privateKey, password, cb)
  }

  removePrivateKey(id: string, index: number, password: string, cb: Callback<Signer>) {
    // Get signer
    const signer = this.get(id)

    if (signer.type !== 'ring') {
      return cb(new Error('Private keys can only be removed from ring signers'), undefined)
    }

    // Add keystore
    (signer as RingSigner).removePrivateKey(index, password, cb)
  }

  addKeystore(
    id: string,
    keystore: Keystore,
    keystorePassword: string,
    password: string,
    cb: Callback<Signer>
  ) {
    // Get signer
    const signer = this.get(id)

    if (signer.type !== 'ring') {
      return cb(new Error('Keystores can only be used with ring signers'), undefined)
    }

    (signer as RingSigner).addKeystore(keystore, keystorePassword, password, cb)
  }

  lock(id: string, cb: Callback<Signer>) {
    const signer = this.get(id)

    // @ts-ignore
    if (signer && signer.lock) {
      (signer as HotSigner).lock(cb)
    }
  }

  unlock(id: string, password: string, cb: Callback<Signer>) {
    const signer = this.signers[id]

    // @ts-ignore
    if (signer && signer.unlock) {
      (signer as HotSigner).unlock(password, cb)
    } else {
      log.error('Signer not unlockable via password, no unlock method')
    }
  }

  unsetSigner() {
    log.info('unsetSigner')
  }
}

export default new Signers()
