// @ts-ignore
import { v5 as uuid } from 'uuid'
import { BaseKeyring } from '@keystonehq/base-eth-keyring'
import { CryptoAccount, CryptoHDKey } from "@keystonehq/bc-ur-registry-eth";

import Signer from '../../Signer'

export default class Keystone extends Signer {

  addressCount: number = 100

  keystoneKeyring: BaseKeyring = new BaseKeyring();

  constructor (id: string) {
    super()
    this.type = 'keystone'
    this.id = id
  }

  syncKeyring({type, cbor}: {type: string, cbor: string}): void {
    if(type === 'crypto-account'){
      this.addressCount = 10
      this.keystoneKeyring.syncKeyring(CryptoAccount.fromCBOR(Buffer.from(cbor, 'hex')))
    } else {
      this.keystoneKeyring.syncKeyring(CryptoHDKey.fromCBOR(Buffer.from(cbor, 'hex')))
    }
  }

  close () {
    this.emit('close')
    this.removeAllListeners()

    super.close()
  }

  async deriveAddresses () {
    this.addresses = []

    let accounts = await this.keystoneKeyring.getAccounts()
    if(!accounts.length){
      await this.keystoneKeyring.addAccounts(this.addressCount)
      accounts = await this.keystoneKeyring.getAccounts()
    }
    this.addresses = accounts

    this.status = 'ok'
    this.emit('update')
  }

  verifyAddress (index: number, current: string, display: boolean, cb: Callback<boolean>) {
    this.keystoneKeyring.__addressFromIndex('m', index).then(address => {
      if(address.toUpperCase() === current.toUpperCase()){
        cb(null, true)
      } else {
        cb(new Error('Address does not match device'), undefined)
      }
    })
  }
}
