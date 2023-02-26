import type { TransactionData } from '../../../../resources/domain/transaction'
import type { TypedMessage } from '../../../accounts/types'

export interface HotSignerWorker {
  lock: (cb: PseudoCallback<never>) => void
  unlock: (cb: PseudoCallback<never>, params: UnlockParams) => void
  signMessage: (cb: PseudoCallback<string>, params: SignMessageParams) => void
  signTypedData: (cb: PseudoCallback<string>, params: SignTypedDataParams) => void
  signTransaction: (cb: PseudoCallback<string>, params: TransactionParams) => void
  encryptSeed?: (cb: PseudoCallback<string>, params: EncryptSeedParams) => void
  addKey?: (cb: PseudoCallback<string>, params: AddKeyParams) => void
  removeKey?: (cb: PseudoCallback<string | null>, params: RemoveKeyParams) => void
}

export type PseudoCallback<T> = (errorMessage: string | null, result?: T) => void

export type UnlockParams = {
  encryptedSecret: string
  password: string
}

export type SignMessageParams = {
  index: number
  message: string
}

export type SignTypedDataParams = {
  index: number
  message: TypedMessage
}

export type TransactionParams = {
  index: number
  rawTx: TransactionData
}

export type EncryptSeedParams = {
  seed: string
  password: string
}

export type AddKeyParams = {
  key: string
  encryptedKeys: string
  password: string
}

export type RemoveKeyParams = {
  index: number
  encryptedKeys: string
  password: string
}

export type RPCMessage = {
  id: string
  method: keyof HotSignerWorker | 'verifyAddress'
  params: any
  token: string
}
