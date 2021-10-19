import log from 'electron-log'
import EventEmitter from 'stream'

import { AppVersion, TransactionData } from '../../transaction'
import { deriveHDAccounts } from './derive'
import crypt from '../../crypt'

export type Callback = (err: Error | null, result: any | undefined) => void

export default class Signer extends EventEmitter {
  id = '';
  type = '';
  name = '';
  status = '';
  coinbase = '0x';
  model = '';
  appVersion: AppVersion = { major: 0, minor: 0, patch: 0 }

  addresses: string[];
  
  constructor () {
    super()

    this.addresses = []
  }

  deriveHDAccounts (publicKey: string, chainCode: string, cb: (err: any, accounts: string[] | undefined) => void) {
    deriveHDAccounts(publicKey, chainCode, cb)
  }

  fingerprint () {
    if (this.addresses && this.addresses.length) return crypt.stringToKey(this.addresses.join()).toString('hex')
  }

  getCoinbase (cb: Callback) {
    cb(null, this.addresses[0])
  }

  verifyAddress (index: number, current: string, display: boolean, cb: Callback) {
    const err = new Error('Signer:' + this.type + ' did not implement verifyAddress method')
    log.error(err)
    cb(err, undefined)
  }

  summary () {
    return {
      id: this.id,
      name: this.name || this.type + ' signer',
      type: this.type,
      model: this.model,
      addresses: this.addresses,
      status: this.status,
      appVersion: this.appVersion || { major: 0, minor: 0, patch: 0 }
    }
  }

  open () {
    // windows.broadcast('main:action', 'addSigner', this.summary())
  }

  close () {
    // windows.broadcast('main:action', 'removeSigner', this.summary())
  }

  update (options = {}) {
    // if (options.setView) windows.broadcast('main:action', 'setView', options.setView)
    // windows.broadcast('main:action', 'updateSigner', this.summary())
  }

  signMessage (index: number, message: string, cb: Callback) {
    console.warn('Signer:' + this.type + ' did not implement a signMessage method')
  }

  signTransaction (index: number, rawTx: TransactionData, cb: Callback) {
    console.warn('Signer:' + this.type + ' did not implement a signTransaction method')
  }

  signTypedData (index: number, version: string, typedData: string, cb: Callback) {
    return cb(new Error(`Signer: ${this.type} does not support eth_signTypedData`), undefined)
  }
}
