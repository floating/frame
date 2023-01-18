import type {
  MessageTypes,
  SignTypedDataVersion,
  TypedDataV1,
  TypedMessage as BaseTypedMessage
} from '@metamask/eth-sig-util'
import type { DecodedCallData } from '../contracts'
import type { Chain } from '../chains'
import type { TransactionData } from '../../resources/domain/transaction'
import type { Action } from '../transaction/actions'

export enum ReplacementType {
  Speed = 'speed',
  Cancel = 'cancel'
}

export enum RequestMode {
  Normal = 'normal',
  Monitor = 'monitor'
}

export enum RequestStatus {
  Pending = 'pending',
  Sending = 'sending',
  Verifying = 'verifying',
  Confirming = 'confirming',
  Confirmed = 'confirmed',
  Sent = 'sent',
  Declined = 'declined',
  Error = 'error',
  Success = 'success'
}

type RequestType =
  | 'sign'
  | 'signTypedData'
  | 'transaction'
  | 'extensionAccess'
  | 'access'
  | 'addChain'
  | 'switchChain'
  | 'addToken'

interface Request {
  type: RequestType
  handlerId: string
}

export interface AccountRequest extends Request {
  origin: string
  payload: JSONRPCRequestPayload
  account: string
  status?: RequestStatus
  mode?: RequestMode
  notice?: string
  created?: number
  res?: (response?: RPCResponsePayload) => void
}

export interface TransactionReceipt {
  gasUsed: string
  blockNumber: string
}

export interface Approval {
  type: string
  data: any
  approved: boolean
  approve: (data: any) => void
}

export interface TransactionRequest extends Omit<AccountRequest, 'type'> {
  type: 'transaction'
  payload: RPC.SendTransaction.Request
  data: TransactionData
  decodedData?: DecodedCallData
  tx?: {
    receipt?: TransactionReceipt
    hash?: string
    confirmations: number
  }
  approvals: Approval[]
  locked?: boolean
  automaticFeeUpdateNotice?: {
    previousFee: any
  }
  recipient?: string // ens name
  updatedFees?: boolean
  feeAtTime?: string
  completed?: number
  feesUpdatedByUser: boolean
  recipientType: string
  recognizedActions: Action<unknown>[]
}

export type TypedData<T extends MessageTypes = MessageTypes> = BaseTypedMessage<T>
export type LegacyTypedData = TypedDataV1

export interface TypedMessage<V extends SignTypedDataVersion = SignTypedDataVersion> {
  data: V extends SignTypedDataVersion.V1 ? LegacyTypedData : TypedData
  version: V
}

export interface SignTypedDataRequest extends Omit<AccountRequest, 'type'> {
  type: 'signTypedData'
  typedMessage: TypedMessage
}

export interface AccessRequest extends Omit<AccountRequest, 'type'> {
  type: 'access'
}

export interface AddChainRequest extends Omit<AccountRequest, 'type'> {
  type: 'addChain'
  chain: Chain
}

export interface AddTokenRequest extends Omit<AccountRequest, 'type'> {
  type: 'addToken'
  token: Token
}
