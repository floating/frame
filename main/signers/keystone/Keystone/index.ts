// @ts-ignore
import { v5 as uuid } from 'uuid'
import { CryptoAccount, CryptoHDKey } from "@keystonehq/bc-ur-registry-eth";
// import { TransactionData } from "../../../transaction";
import { addHexPrefix } from "ethereumjs-util";

import Signer from '../../Signer'
import { KeystoneKeyring } from "./KeystoneKeyring";
import chainConfig from "../../../chains/config";
import { TransactionFactory } from "@ethereumjs/tx";
import { TypedData } from "eth-sig-util";
import log from "electron-log";
import {TransactionData} from "../../../../resources/domain/transaction";

export default class Keystone extends Signer {

  addressCount: number = 100

  keystoneKeyring: KeystoneKeyring = new KeystoneKeyring();

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

  verifyAddress(index: number, current: string, display: boolean, cb: Callback<boolean>) {
    this.keystoneKeyring.__addressFromIndex('m', index).then(address => {
      if (address.toUpperCase() === current.toUpperCase()) {
        log.info(`address ${address} matches device`)
        cb(null, true)
      } else {
        const error = new Error('Address does not match device')
        log.error(error)
        cb(error, undefined)
      }
    })
  }

  signTransaction(index: number, rawTx: TransactionData, cb: Callback<string>) {
    const common = chainConfig(parseInt(rawTx.chainId), parseInt(rawTx.type) === 2 ? 'london' : 'berlin')
    const transaction = TransactionFactory.fromTxData(rawTx, {common})

    this.keystoneKeyring.signTransaction(rawTx.from!, transaction).then((signedTx) => {
      log.info('successfully signed transaction on Keystone: ', transaction)

      cb(null, addHexPrefix(signedTx.serialize().toString('hex')))
    }).catch((error) => {
      log.error('error signing transaction on Keystone', error.toString())

      const message = 'Sign transaction error'
      cb(new Error(message), undefined)
    })
  }

  signMessage(index: number, message: string, cb: Callback<string>) {
    this.keystoneKeyring.__addressFromIndex('m', index).then(address => {
      this.keystoneKeyring.signMessage(address, message)
        .then(signedMessage => {
          log.info('successfully signed message on Keystone: ', message)

          cb(null, signedMessage)
        }).catch((error) => {
        log.error('error signing message on Keystone', error.toString())

        const message = 'Sign message error'
        cb(new Error(message), undefined)
      })
    })
  }

  signTypedData (index: number, version: string, typedData: TypedData, cb: Callback<string>) {
    this.keystoneKeyring.__addressFromIndex('m', index).then(address => {
      this.keystoneKeyring.signTypedData(address, typedData)
        .then(signedMessage => {
          log.info('successfully signed typed data on Keystone: ', typedData)

          cb(null, signedMessage)
        }).catch((error) => {
        log.error('error signing typed data on Keystone', error.toString())

        const message = 'Sign typed data error'
        cb(new Error(message), undefined)
      })
    })
  }
}
