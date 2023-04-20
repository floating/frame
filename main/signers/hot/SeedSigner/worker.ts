import hdKey from 'hdkey'

import {
  decrypt,
  encrypt,
  isHotSignerMethod,
  signMessage,
  signTransaction,
  signTypedData
} from '../HotSigner/worker'

import type {
  CoreWorkerMethod,
  EncryptSeedParams,
  HotSignerMessageHandler,
  PseudoCallback,
  SeedSignerMethod,
  SignMessageParams,
  SignTypedDataParams,
  TransactionParams,
  UnlockParams,
  WorkerMethod
} from '../HotSigner/types'

function derivePrivateKey(index: number, seed: string) {
  const key = hdKey.fromMasterSeed(Buffer.from(seed as string, 'hex')).derive("m/44'/60'/0'/0/" + index)

  return key.privateKey
}

function isSeedSignerMethod(method: string): method is CoreWorkerMethod | SeedSignerMethod {
  return isHotSignerMethod(method) || ['encryptSeed'].includes(method)
}

export default class SeedSignerWorker implements HotSignerMessageHandler {
  private seed: string | null = null

  handleMessage(cb: PseudoCallback<unknown>, method: WorkerMethod, params: any) {
    if (isSeedSignerMethod(method)) {
      return this[method](cb, params)
    }

    cb(`Invalid method: '${method}'`)
  }

  unlock(cb: PseudoCallback<never>, { encryptedSecret: encryptedSeed, password }: UnlockParams) {
    try {
      this.seed = decrypt(encryptedSeed, password)
      cb(null)
    } catch (e) {
      cb('Invalid password')
    }
  }

  lock(cb: PseudoCallback<never>) {
    this.seed = null
    cb(null)
  }

  encryptSeed(cb: PseudoCallback<string>, { seed, password }: EncryptSeedParams) {
    cb(null, encrypt(seed, password))
  }

  signMessage(cb: PseudoCallback<string>, { index, message }: SignMessageParams) {
    // Make sure signer is unlocked
    if (!this.seed) return cb('Signer locked')

    const key = derivePrivateKey(index, this.seed)
    signMessage(key, message, cb)
  }

  signTypedData(cb: PseudoCallback<string>, { index, message }: SignTypedDataParams) {
    // Make sure signer is unlocked
    if (!this.seed) return cb('Signer locked')

    const key = derivePrivateKey(index, this.seed)
    signTypedData(key, message, cb)
  }

  signTransaction(cb: PseudoCallback<string>, { index, rawTx }: TransactionParams) {
    // Make sure signer is unlocked
    if (!this.seed) return cb('Signer locked')

    const key = derivePrivateKey(index, this.seed)
    signTransaction(key, rawTx, cb)
  }
}
