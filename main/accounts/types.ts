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
import { TokenData } from '../contracts/erc20'

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

export type TypedSignatureRequestType = 'signTypedData' | 'signErc20Permit'

export type SignatureRequestType = 'sign' | TypedSignatureRequestType

export type RequestType =
  | SignatureRequestType
  | 'transaction'
  | 'access'
  | 'addChain'
  | 'switchChain'
  | 'addToken'

interface Request {
  type: RequestType
  handlerId: string
}

export type Identity = {
  address: Address
  ens: string
  type: string
}

export interface AccountRequest<T extends RequestType = RequestType> extends Request {
  type: T
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

export interface Permit {
  deadline: string | number
  spender: string
  value: string | number
  owner: string
  verifyingContract: string
  chainId: number
  nonce: string | number
}

export enum TxClassification {
  CONTRACT_DEPLOY = 'CONTRACT_DEPLOY',
  CONTRACT_CALL = 'CONTRACT_CALL',
  SEND_DATA = 'SEND_DATA',
  NATIVE_TRANSFER = 'NATIVE_TRANSFER'
}

export interface TransactionRequest extends AccountRequest<'transaction'> {
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
  classification: TxClassification
}

export type TypedData<T extends MessageTypes = MessageTypes> = BaseTypedMessage<T>
export type LegacyTypedData = TypedDataV1

export interface TypedMessage<V extends SignTypedDataVersion = SignTypedDataVersion> {
  data: V extends SignTypedDataVersion.V1 ? LegacyTypedData : TypedData
  version: V
}

export type SignTypedDataRequest = DefaultSignTypedDataRequest | PermitSignatureRequest

export type SignatureRequest = SignTypedDataRequest | AccountRequest<'sign'>

export interface DefaultSignTypedDataRequest extends AccountRequest<'signTypedData'> {
  typedMessage: TypedMessage
}

interface EIP2612PermitDomain {
  chainId: number
  verifyingContract: string
}

export interface EIP2612TypedData {
  types: MessageTypes
  primaryType: 'Permit'
  domain: EIP2612PermitDomain
  message: Omit<Permit, 'chainId' | 'verifyingContract'>
}

interface PermitData extends Omit<Permit, 'spender' | 'verifyingContract'> {
  spender: Identity
  verifyingContract: Identity
}

export interface PermitSignatureRequest extends AccountRequest<'signErc20Permit'> {
  typedMessage: {
    data: EIP2612TypedData
    version: SignTypedDataVersion
  }
  permit: PermitData
  tokenData: TokenData
}

export interface AccessRequest extends AccountRequest<'access'> {}

export interface AddChainRequest extends AccountRequest<'addChain'> {
  chain: Chain
}

export interface AddTokenRequest extends AccountRequest<'addToken'> {
  token: Token
}
