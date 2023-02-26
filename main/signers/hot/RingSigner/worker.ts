import {
  decrypt,
  encrypt,
  isHotSignerMethod,
  signMessage,
  signTransaction,
  signTypedData
} from '../HotSigner/controller'

import type {
  AddKeyParams,
  CoreWorkerMethod,
  HotSignerWorker,
  PseudoCallback,
  RemoveKeyParams,
  RingSignerMethod,
  SignMessageParams,
  SignTypedDataParams,
  TransactionParams,
  UnlockParams,
  WorkerMethod
} from '../HotSigner/types'

function decryptKeys(encryptedKeys: string, password: string) {
  const keyString = decrypt(encryptedKeys, password)
  return keyString.split(':')
}

function encryptKeys(keys: string[], password: string) {
  const keyString = keys.join(':')
  return encrypt(keyString, password)
}

function isRingSignerMethod(method: string): method is RingSignerMethod | CoreWorkerMethod {
  return isHotSignerMethod(method) || ['addKey', 'removeKey'].includes(method)
}

export default class RingSignerWorker implements HotSignerWorker {
  private keys: Buffer[] | null = null

  handleMessage(cb: PseudoCallback<unknown>, method: WorkerMethod, params: any) {
    if (isRingSignerMethod(method)) {
      return this[method](cb, params)
    }

    cb(`Invalid method: '${method}'`)
  }

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
