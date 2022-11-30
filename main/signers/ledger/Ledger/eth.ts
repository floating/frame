import log from 'electron-log'
import { encode } from 'rlp'
import { addHexPrefix, stripHexPrefix, padToEven } from '@ethereumjs/util'
import { SignTypedDataVersion, TypedDataUtils } from '@metamask/eth-sig-util'
import Transport from '@ledgerhq/hw-transport'
import Eth from '@ledgerhq/hw-app-eth'

import { Derivation, getDerivationPath, deriveHDAccounts } from '../../Signer/derive'
import { sign } from '../../../transaction'
import { DeviceError } from '.'

import type { TypedData } from '../../../accounts/types'
import type { TransactionData } from '../../../../resources/domain/transaction'

export default class LedgerEthereumApp {
  private eth: Eth

  constructor (transport: Transport) {
    this.eth = new Eth(transport)
  }

  async close () {
    return this.eth.transport.close()
  }

  async deriveAddresses (derivation: Derivation) {
    log.info(`deriving ${derivation} Ledger addresses`)

    const path = getDerivationPath(derivation)

    const executor = async (resolve: (addresses: string[]) => void, reject: (err?: Error) => void) => {
      try {
        const result = await this.getAddress(path, false, true)
        deriveHDAccounts(result.publicKey, result.chainCode || '', (err, addresses) => {
          if (err) return reject(err)
          resolve(addresses as string[])
        })
      } catch (err) {
        reject(err as Error)
      }
    }

    return new Promise(executor)
  }

  async signMessage (path: string, message: string) {
    const rawMessage = stripHexPrefix(message)
    
    const signature = await this.eth.signPersonalMessage(path, rawMessage)
    const hashedSignature = signature.r + signature.s + padToEven((signature.v - 27).toString(16))

    return addHexPrefix(hashedSignature)
  }

  async signTypedData (path: string, typedData: TypedData) {
    let domainSeparatorHex, hashStructMessageHex

    try {
      const { domain, types, primaryType, message } = TypedDataUtils.sanitizeData(typedData)
      domainSeparatorHex = TypedDataUtils.hashStruct('EIP712Domain', domain, types, SignTypedDataVersion.V4).toString('hex')
      hashStructMessageHex = TypedDataUtils.hashStruct(primaryType as string, message, types, SignTypedDataVersion.V4).toString('hex')
    } catch (e) {
      throw new DeviceError('Invalid typed data', 99901)
    }

    const signature = await this.eth.signEIP712HashedMessage(path, domainSeparatorHex, hashStructMessageHex)
    const hashedSignature = signature.r + signature.s + padToEven((signature.v - 27).toString(16))

    return addHexPrefix(hashedSignature)
  }

  async signTransaction (path: string, ledgerTx: TransactionData) {
    const signedTx = await sign(ledgerTx, tx => {
      // legacy transactions aren't RLP encoded before they're returned
      const message = tx.getMessageToSign(false)
      const legacyMessage = message[0] !== tx.type
      const rawTxHex = legacyMessage ? encode(message).toString() : message.toString('hex')

      return this.eth.signTransaction(path, rawTxHex, null)
    })

    return addHexPrefix(signedTx.serialize().toString('hex'))
  }

  async getAddress (path: string, display: boolean, chainCode: boolean) {
    return this.eth.getAddress(path, display, chainCode)
  }

  async getAppConfiguration () {
    return this.eth.getAppConfiguration()
  }
}
