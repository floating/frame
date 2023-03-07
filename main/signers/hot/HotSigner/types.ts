import type { TransactionData } from '../../../../resources/domain/transaction'
import type { TypedMessage } from '../../../accounts/types'

export interface HotSignerMessageHandler {
  handleMessage: (cb: PseudoCallback<unknown>, method: WorkerMethod, params: any) => void
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

export type CoreWorkerMethod = 'lock' | 'unlock' | 'signMessage' | 'signTypedData' | 'signTransaction'
export type SeedSignerMethod = 'encryptSeed'
export type RingSignerMethod = 'addKey' | 'removeKey'
export type WorkerMethod = CoreWorkerMethod | SeedSignerMethod | RingSignerMethod
export type RPCMethod = WorkerMethod | 'verifyAddress'

export type RPCMessage = {
  id: string
  method: RPCMethod
  params: any
  token: string
}

type WorkerMessageType = 'rpc' | 'token'

export type WorkerMessage = {
  type: WorkerMessageType
}

export type WorkerTokenMessage = WorkerMessage & {
  token: string
}

export type WorkerRPCMessage = WorkerMessage & {
  id: string
  error?: string
  result?: unknown
}
