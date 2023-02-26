import hdKey from 'hdkey'

import { decrypt, encrypt, signMessage, signTransaction, signTypedData } from '../HotSigner/worker'

import type {
  EncryptSeedParams,
  HotSignerWorker,
  PseudoCallback,
  SignMessageParams,
  SignTypedDataParams,
  TransactionParams,
  UnlockParams
} from '../HotSigner/types'

function derivePrivateKey(index: number, seed: string) {
  const key = hdKey.fromMasterSeed(Buffer.from(seed as string, 'hex')).derive("m/44'/60'/0'/0/" + index)

  return key.privateKey
}

export default class SeedSignerWorker implements HotSignerWorker {
  private seed: string | null = null

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
