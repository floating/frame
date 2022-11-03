import { HotSignerWorker, Message, PseudoCallback } from '../HotSigner/worker'
import crypto from 'crypto'
import {
  hashPersonalMessage,
  toBuffer,
  pubToAddress,
  ecrecover
} from 'ethereumjs-util'
import { TypedMessage } from '../../../accounts/types'
import { TransactionData } from '../../../../resources/domain/transaction'

class RingSignerWorker extends HotSignerWorker {
  private keys?: Buffer[]
  public type = 'ring'

  constructor () {
    super()
    process.on('message', (message: Message) => this.handleMessage(message))
  }

  unlock ({ encryptedKeys, password }: { encryptedKeys: string, password: Buffer }, cb: PseudoCallback) {
    try {
      this.keys = this._decrypt(encryptedKeys, password)
        .split(':')
        .map((key) => Buffer.from(key, 'hex'))
      cb()
    } catch (e) {
      cb(new Error('Invalid password'))
    }
  }

  lock (_payload: undefined, cb: PseudoCallback) {
    this.keys = undefined
    cb()
  }

  addKey ({ encryptedKeys, key, password }: { encryptedKeys: string, key: string, password: Buffer }, cb: PseudoCallback) {
    let keys
    // If signer already has encrypted keys -> decrypt them and add new key
    if (encryptedKeys) keys = [...this._decryptKeys(encryptedKeys, password), key]
    // Else -> generate new list of keys
    else keys = [key]
    // Encrypt and return list of keys
    encryptedKeys = this._encryptKeys(keys, password)
    cb(undefined, encryptedKeys)
  }

  removeKey ({ encryptedKeys, index, password }: { encryptedKeys: string, index: number, password: Buffer }, cb: PseudoCallback) {
    if (!encryptedKeys) return cb(new Error('Signer does not have any keys'))
    // Get list of decrypted keys
    let keys = this._decryptKeys(encryptedKeys, password)
    // Remove key from list
    keys = keys.filter((key) => key !== keys[index])
    // Return encrypted list (or null if empty)
    const result = keys.length > 0 ? this._encryptKeys(keys, password) : undefined
    cb(undefined, result)
  }

  signMessage ({ index, message }: { index?: number, message: string }, cb: PseudoCallback) {
    // Make sure signer is unlocked
    if (!this.keys) return cb(new Error('Signer locked'))
    // Sign message
    super.signMessage({ key: this.keys[index as number], message }, cb)
  }

  signTypedData ({ index, typedMessage }: { index?: number, typedMessage: TypedMessage }, cb: PseudoCallback) {
    // Make sure signer is unlocked
    if (!this.keys) return cb(new Error('Signer locked'))
    // Sign Typed Data
    super.signTypedData({ key: this.keys[index as number], typedMessage }, cb)
  }

  signTransaction ({ index, rawTx }: { index?: number, rawTx: TransactionData }, cb: PseudoCallback) {
    // Make sure signer is unlocked
    if (!this.keys) return cb(new Error('Signer locked'))
    // Sign transaction
    super.signTransaction({ key: this.keys[index as number], rawTx }, cb)
  }

  verifyAddress ({ index, address }: { index: number, address: string }, cb: PseudoCallback) {
    const message = '0x' + crypto.randomBytes(32).toString('hex')
    this.signMessage({ index, message }, (err?: Error, signedMessage?: string) => {
      // Handle signing errors
      if (err) return cb(err)
      // Signature -> buffer
      const signature = Buffer.from((signedMessage as string).replace('0x', ''), 'hex')
      // Ensure correct length
      if (signature.length !== 65) return cb(new Error('Frame verifyAddress signature has incorrect length'))
      // Verify address
      let v = signature[64]
      v = v === 0 || v === 1 ? v + 27 : v
      const r = toBuffer(signature.slice(0, 32))
      const s = toBuffer(signature.slice(32, 64))
      const hash = hashPersonalMessage(toBuffer(message))
      const verifiedAddress = '0x' + pubToAddress(ecrecover(hash, v, r, s)).toString('hex')
      // Return result
      cb(undefined, verifiedAddress.toLowerCase() === address.toLowerCase() ? 'true' : 'false')
    })
  }

  _decryptKeys (encryptedKeys: string, password: Buffer) {
    const keyString = this._decrypt(encryptedKeys, password)
    return keyString.split(':')
  }

  _encryptKeys (keys: string[], password: Buffer) {
    const keyString = keys.join(':')
    return this._encrypt(keyString, password)
  }
}

export const ringSignerWorker = new RingSignerWorker()
