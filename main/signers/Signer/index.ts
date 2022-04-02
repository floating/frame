import log from 'electron-log'
import EventEmitter from 'stream'

import { TransactionData } from '../../transaction'
import { deriveHDAccounts } from './derive'
import crypt from '../../crypt'
import { TypedData } from 'eth-sig-util'

export interface SignerSummary {
  id: string,
  name: string,
  model: string,
  type: string,
  addresses: string[],
  status: string,
  appVersion: AppVersion
}

export interface AppVersion {
  major: number,
  minor: number,
  patch: number
}

// in order of increasing priority
export enum Type {
  Ring = 'ring',
  Seed = 'seed',
  Aragon = 'aragon',
  Trezor = 'trezor',
  Ledger = 'ledger',
  Lattice = 'lattice',
  Keystone = 'keystone'
}

export function getType (typeValue: string) {
  return Object.values(Type).find(type => type === typeValue)
}

export default class Signer extends EventEmitter {
  id = ''
  type = ''
  name = ''
  status = ''
  coinbase = '0x'
  model = ''
  appVersion: AppVersion = { major: 0, minor: 0, patch: 0 }

  addresses: string[]
  
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

  getCoinbase (cb: Callback<string>) {
    cb(null, this.addresses[0])
  }

  verifyAddress (index: number, current: string, display: boolean, cb: Callback<boolean>) {
    const err = new Error('Signer:' + this.type + ' did not implement verifyAddress method')
    log.error(err)
    cb(err, undefined)
  }

  summary (): SignerSummary {
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

  delete () {
    console.warn('Signer:' + this.type + ' did not implement a delete method')
  }

  update (options = {}) {
    // if (options.setView) windows.broadcast('main:action', 'setView', options.setView)
    // windows.broadcast('main:action', 'updateSigner', this.summary())
  }

  signMessage (index: number, message: string, cb: Callback<string>) {
    console.warn('Signer:' + this.type + ' did not implement a signMessage method')
  }

  signTransaction (index: number, rawTx: TransactionData, cb: Callback<string>) {
    console.warn('Signer:' + this.type + ' did not implement a signTransaction method')
  }

  signTypedData (index: number, version: string, typedData: TypedData, cb: Callback<string>) {
    return cb(new Error(`Signer: ${this.type} does not support eth_signTypedData`), undefined)
  }
}
