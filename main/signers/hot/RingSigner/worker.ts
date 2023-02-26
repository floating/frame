import { decrypt, encrypt, signMessage, signTransaction, signTypedData } from '../HotSigner/worker'

import type {
  AddKeyParams,
  HotSignerWorker,
  PseudoCallback,
  RemoveKeyParams,
  SignMessageParams,
  SignTypedDataParams,
  TransactionParams,
  UnlockParams
} from '../HotSigner/types'

function decryptKeys(encryptedKeys: string, password: string) {
  const keyString = decrypt(encryptedKeys, password)
  return keyString.split(':')
}

function encryptKeys(keys: string[], password: string) {
  const keyString = keys.join(':')
  return encrypt(keyString, password)
}

export default class RingSignerWorker implements HotSignerWorker {
  private keys: Buffer[] | null = null

  unlock(cb: PseudoCallback<never>, { encryptedSecret: encryptedKeys, password }: UnlockParams) {
    try {
      this.keys = decrypt(encryptedKeys, password)
        .split(':')
        .map((key) => Buffer.from(key, 'hex'))
      cb(null)
    } catch (e) {
      cb('Invalid password')
    }
  }

  lock(cb: PseudoCallback<never>) {
    this.keys = null
    cb(null)
  }

  addKey(cb: PseudoCallback<string>, { encryptedKeys, key, password }: AddKeyParams) {
    // If signer already has encrypted keys -> decrypt them and add new key
    // Else -> generate new list of keys
    const keys = encryptedKeys ? [...decryptKeys(encryptedKeys, password), key] : [key]

    // Encrypt and return list of keys
    const newlyEncryptedKeys = encryptKeys(keys, password)

    cb(null, newlyEncryptedKeys)
  }

  removeKey(cb: PseudoCallback<string | null>, { encryptedKeys, index, password }: RemoveKeyParams) {
    if (!encryptedKeys) return cb('Signer does not have any keys')

    const decryptedKeys = decryptKeys(encryptedKeys, password)
    const keys = decryptedKeys.filter((key) => key !== decryptedKeys[index])

    // Return encrypted list (or null if empty)
    const result = keys.length > 0 ? encryptKeys(keys, password) : null

    cb(null, result)
  }

  signMessage(cb: PseudoCallback<string>, { index, message }: SignMessageParams) {
    // Make sure signer is unlocked
    if (!this.keys) return cb('Signer locked')

    signMessage(this.keys[index], message, cb)
  }

  signTypedData(cb: PseudoCallback<string>, { index, message }: SignTypedDataParams) {
    // Make sure signer is unlocked
    if (!this.keys) return cb('Signer locked')

    signTypedData(this.keys[index], message, cb)
  }

  signTransaction(cb: PseudoCallback<string>, { index, rawTx }: TransactionParams) {
    // Make sure signer is unlocked
    if (!this.keys) return cb('Signer locked')

    signTransaction(this.keys[index], rawTx, cb)
  }
}
