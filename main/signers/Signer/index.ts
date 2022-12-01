import log from 'electron-log'
import EventEmitter from 'stream'
import { addHexPrefix } from '@ethereumjs/util'

import { deriveHDAccounts } from './derive'
import crypt from '../../crypt'
import { TransactionData } from '../../../resources/domain/transaction'
import { getSignerDisplayType } from '../../../resources/domain/signer'
import type { TypedMessage } from '../../accounts/types'

export interface SignerSummary {
  id: string
  name: string
  model: string
  type: string
  addresses: string[]
  status: string
  appVersion: AppVersion
}

export interface AppVersion {
  major: number
  minor: number
  patch: number
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

  constructor() {
    super()

    this.addresses = []
  }

  deriveHDAccounts(publicKey: string, chainCode: string, cb: Callback<string[]>) {
    deriveHDAccounts(publicKey, chainCode, cb)
  }

  fingerprint() {
    if (this.addresses && this.addresses.length)
      return crypt.stringToKey(this.addresses.join()).toString('hex')
  }

  getCoinbase(cb: Callback<string>) {
    cb(null, this.addresses[0].toString())
  }

  verifyAddress(index: number, current: string, display: boolean, cb: Callback<boolean>) {
    const err = new Error('Signer:' + this.type + ' did not implement verifyAddress method')
    log.error(err)
    cb(err, undefined)
  }

  summary(): SignerSummary {
    return {
      id: this.id,
      name: this.name || `${getSignerDisplayType(this)} signer`,
      type: this.type,
      model: this.model,
      addresses: this.addresses.map((addr) => addHexPrefix(addr.toString())),
      status: this.status,
      appVersion: this.appVersion || { major: 0, minor: 0, patch: 0 },
    }
  }

  open(device?: any) {
    log.warn(`Signer: ${this.type} did not implement an open method`)
  }

  close() {
    log.warn(`Signer: ${this.type} did not implement a close method`)
  }

  delete() {
    log.warn(`Signer: ${this.type} did not implement a delete method`)
  }

  update(options = {}) {
    log.warn(`Signer: ${this.type} did not implement an update method`)
  }

  signMessage(index: number, message: string, cb: Callback<string>) {
    log.warn(`Signer: ${this.type} did not implement a signMessage method`)
  }

  signTransaction(index: number, rawTx: TransactionData, cb: Callback<string>) {
    log.warn(`Signer: ${this.type} did not implement a signTransaction method`)
  }

  signTypedData(index: number, typedMessage: TypedMessage, cb: Callback<string>) {
    return cb(new Error(`Signer: ${this.type} does not support eth_signTypedData`), undefined)
  }
}
