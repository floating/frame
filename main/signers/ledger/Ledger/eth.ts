// @ts-nocheck

import { rlp, addHexPrefix, stripHexPrefix, padToEven } from 'ethereumjs-util'
import { TypedDataUtils } from 'eth-sig-util'
import log from 'electron-log'

import Transport from '@ledgerhq/hw-transport'
import Eth from '@ledgerhq/hw-app-eth'

import { Derivation, getDerivationPath, deriveHDAccounts } from '../../Signer/derive'
import { sign } from '../../../transaction'

export default class LedgerEthereumApp {
  private eth: Eth;

  constructor (transport: Transport) {
    this.eth = new Eth(transport)
  }

  async close () {
    return this.eth.transport.close()
  }

  async deriveAddresses (derivation: Derivation) {
    log.debug(`deriving ${derivation} Ledger addresses`)

    const path = getDerivationPath(derivation)

    const executor = async (resolve: (addresses: string[]) => void, reject) => {
      try {
        const result = await this.getAddress(path, false, true)
        deriveHDAccounts(result.publicKey, result.chainCode, (err, addresses) => {
          if (err) reject(err)
          else resolve(addresses)
        })
      } catch (err) {
        reject(err)
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

  async signTypedData (path: string, typedData: any) {
    const { domain, types, primaryType, message } = TypedDataUtils.sanitizeData(typedData)
    const domainSeparatorHex = TypedDataUtils.hashStruct('EIP712Domain', domain, types).toString('hex')
    const hashStructMessageHex = TypedDataUtils.hashStruct(primaryType, message, types).toString('hex')

    const signature = await this.eth.signEIP712HashedMessage(path, domainSeparatorHex, hashStructMessageHex)
    const hashedSignature = signature.r + signature.s + padToEven((signature.v - 27).toString(16))

    return addHexPrefix(hashedSignature)
  }

  async signTransaction (path: string, ledgerTx: TransactionData) {
    const signedTx = await sign(ledgerTx, tx => {
      // legacy transactions aren't RLP encoded before they're returned
      const message = tx.getMessageToSign(false)
      const legacyMessage = message[0] !== tx.type
      const rawTxHex = legacyMessage ? rlp.encode(message).toString('hex') : message.toString('hex')

      return this.eth.signTransaction(path, rawTxHex)
    })

    return addHexPrefix(signedTx.serialize().toString('hex'))
  }

  async getAddress (path: string, display, chainCode ) {
    return this.eth.getAddress(path, display, chainCode)
  }

  async getAppConfiguration () {
    return this.eth.getAppConfiguration()
  }
}
