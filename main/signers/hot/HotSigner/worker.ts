import crypto from 'crypto'
import { MessageTypes, signTypedData } from '@metamask/eth-sig-util'
import { TransactionFactory } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'
import {
  BN,
  hashPersonalMessage,
  toBuffer,
  ecsign,
  addHexPrefix
} from 'ethereumjs-util'
import log from 'electron-log'

import { TypedMessage } from '../../../accounts/types'
import { TransactionData } from '../../../../resources/domain/transaction'

function chainConfig (chain: number, hardfork: string) {
  const chainId = new BN(chain)

  return Common.isSupportedChainId(chainId)
    ? new Common({ chain: chainId.toNumber(), hardfork })
    : Common.custom({ chainId: chainId.toNumber() }, { baseChain: 'mainnet', hardfork })
}

export type PseudoCallback = (err: Error | null, result?: string) => void
export interface Message { 
  id: string 
  method: string
  params: Record<string, unknown>
  token: string
}

export class HotSignerWorker {
  protected token: string
  public type = ''

  constructor () {
    const token = crypto.randomBytes(32).toString('hex')
    this.token = token
    if (process.send) {
      process?.send({ type: 'token', token })
    }
  }

  handleMessage ({ id, method, params, token }: Message) {
    log.warn(`HotSignerWorker: ${this.type} did not implement a handleMessage method`)
  }

  signMessage ({ key, message }: { index?: number, key?: Buffer, message?: string }, cb: PseudoCallback) {
    // Hash message
    const hash = hashPersonalMessage(toBuffer(message))

    // Sign message
    const signed = ecsign(hash, key as Buffer)

    // Return serialized signed message
    const hex = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]).toString('hex')

    cb(null, addHexPrefix(hex))
  }

  signTypedData ({ key, typedMessage }: { key?: Buffer, typedMessage?: TypedMessage }, cb: PseudoCallback) {
    try {
      const { data, version } = typedMessage as TypedMessage
      const signature = signTypedData<typeof version, MessageTypes>({ privateKey: key as Buffer, data, version })
      cb(null, signature)
    } catch (e) {
      cb(e as Error)
    }
  }

  signTransaction ({ key, rawTx }: { key?: Buffer, rawTx?: TransactionData }, cb: PseudoCallback) {
    if (!rawTx?.chainId) {
      console.error(`invalid chain id ${rawTx?.chainId} for transaction`)
      return cb(new Error('could not determine chain id for transaction'))
    }

    const chainId = parseInt(rawTx.chainId)
    const hardfork = parseInt(rawTx.type) === 2 ? 'london' : 'berlin'
    const common = chainConfig(chainId, hardfork)

    const tx = TransactionFactory.fromTxData(rawTx, { common })
    const signedTx = tx.sign(key as Buffer)
    const serialized = signedTx.serialize().toString('hex')

    cb(null, addHexPrefix(serialized))
  }

  verifyAddress ({ index, address }: { index?: number, address?: string }, cb: PseudoCallback) {
    log.warn(`HotSignerWorker: ${this.type} did not implement a verifyAddress method`)
  }

  _encrypt (unencrypted: string, password: Buffer) {
    const salt = crypto.randomBytes(16)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', this._hashPassword(password, salt) as Buffer, iv)
    const encrypted = Buffer.concat([cipher.update(unencrypted), cipher.final()])
    return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  _decrypt (encrypted: string, password: Buffer) {
    const parts = encrypted.split(':')
    const salt = Buffer.from(parts.shift() as string, 'hex')
    const iv = Buffer.from(parts.shift() as string, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', this._hashPassword(password, salt) as Buffer, iv)
    const encryptedString = Buffer.from(parts.join(':'), 'hex')
    const decrypted = Buffer.concat([decipher.update(encryptedString), decipher.final()])
    return decrypted.toString()
  }

  _hashPassword (password: Buffer, salt: Buffer) {
    try {
      return crypto.scryptSync(password, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 36000000 })
    } catch (e) {
      console.error('Error during hashPassword', e) // TODO: Handle Error
    }
  }
}
