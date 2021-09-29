import log from 'electron-log'
import EventEmitter from 'stream'

import deriveHDAccounts from './derive'
import crypt from '../../crypt'

interface AppVersion {
  major: number,
  minor: number,
  patch: number
}

type Callback = (err: any, result: any) => void

export default class Signer extends EventEmitter {
  id = '';
  type = '';
  name = '';
  status = '';
  appVersion: AppVersion = { major: 0, minor: 0, patch: 0 }

  liveAddressesFound = 0;
  addresses: string[];
  
  constructor () {
    super()

    this.addresses = []
  }

  deriveHDAccounts (publicKey: string, chainCode: string, cb: () => void) {
    deriveHDAccounts(publicKey, chainCode, cb)
  }

  fingerprint () {
    if (this.addresses && this.addresses.length) return crypt.stringToKey(this.addresses.join()).toString('hex')
  }

  getCoinbase (cb: Callback) {
    cb(null, this.addresses[0])
  }

  verifyAddress (cb: Callback) {
    const err = new Error('Signer:' + this.type + ' did not implement verifyAddress method')
    log.error(err)
    cb(err, undefined)
  }

  summary () {
    return {
      id: this.id,
      name: this.name || this.type + ' signer',
      type: this.type,
      addresses: this.addresses,
      status: this.status,
      liveAddressesFound: this.liveAddressesFound || 0,
      appVersion: this.appVersion || { major: 0, minor: 0, patch: 0 }
    }
  }

  open () {
    // windows.broadcast('main:action', 'addSigner', this.summary())
  }

  close () {
    // windows.broadcast('main:action', 'removeSigner', this.summary())
  }

  delete () {
    
  }

  update (options = {}) {
    // if (options.setView) windows.broadcast('main:action', 'setView', options.setView)
    // windows.broadcast('main:action', 'updateSigner', this.summary())
  }

  signMessage (index: number, message: string, cb: Callback) {
    console.warn('Signer:' + this.type + ' did not implement a signMessage method')
  }

  signTransaction (index: number, rawTx: string, cb: Callback) {
    console.warn('Signer:' + this.type + ' did not implement a signTransaction method')
  }

  signTypedData (index: number, typedData: string, cb: Callback) {
    return cb(new Error(`Signer: ${this.type} does not support eth_signTypedData`), undefined)
  }
}
