import { rlp, addHexPrefix, stripHexPrefix, padToEven } from 'ethereumjs-util'
import { TypedData, TypedDataUtils, TypedMessage } from 'eth-sig-util'
import log from 'electron-log'

import Transport from '@ledgerhq/hw-transport'
import Eth from '@ledgerhq/hw-app-eth'

import { Derivation, getDerivationPath, deriveHDAccounts } from '../../Signer/derive'
import { convertToUnsignedTransaction, TransactionData } from '../../../../resources/domain/transaction'
import { sign } from '../../../transaction'
import { DeviceError } from '.'
import { serializeTransaction } from 'ethers/lib/utils'

export default class LedgerEthereumApp {
  private eth: Eth;

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
      domainSeparatorHex = TypedDataUtils.hashStruct('EIP712Domain', domain, types).toString('hex')
      hashStructMessageHex = TypedDataUtils.hashStruct(primaryType as string, message, types).toString('hex')
    } catch (e) {
      throw new DeviceError('Invalid typed data', 99901)
    }

    const signature = await this.eth.signEIP712HashedMessage(path, domainSeparatorHex, hashStructMessageHex)
    const hashedSignature = signature.r + signature.s + padToEven((signature.v - 27).toString(16))

    return addHexPrefix(hashedSignature)
  }

  async signTransaction (path: string, ledgerTx: TransactionData) {
    const signedTx = await sign(ledgerTx, (tx: TransactionData) => {
      const unsigned =  convertToUnsignedTransaction(tx)
      const message = serializeTransaction(
        unsigned
      )
      return this.eth.signTransaction(path, message.substring(2), null)
    })

    return addHexPrefix(signedTx)
  }

  async getAddress (path: string, display: boolean, chainCode: boolean) {
    return this.eth.getAddress(path, display, chainCode)
  }

  async getAppConfiguration () {
    return this.eth.getAppConfiguration()
  }
}
