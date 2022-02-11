import type { Version } from 'eth-sig-util'
import type { DecodedCallData } from '../abi'
import type { Chain } from '../chains'
import type { TransactionData } from '../transaction'

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
  Declined = 'declined',
  Error = 'error',
  Success = 'success'
}

type RequestType = 'sign' | 'signTypedData' | 'transaction' | 'access' | 'addChain' | 'switchChain' | 'addToken'

export interface AccountRequest {
  type: RequestType,
  origin: string,
  payload: JSONRPCRequestPayload,
  handlerId: string,
  account: string,
  status?: RequestStatus,
  mode?: RequestMode,
  notice?: string,
  created?: number,
  res?: (response?: RPCResponsePayload) => void
}

export interface TransactionReceipt {
  gasUsed: string,
  blockNumber: string
}

export interface TransactionRequest extends Omit<AccountRequest, 'type'> {
  type: 'transaction',
  payload: RPC.SendTransaction.Request,
  data: TransactionData,
  decodedData?: DecodedCallData,
  tx?: {
    receipt?: TransactionReceipt,
    hash?: string,
    confirmations: number
  },
  locked?: boolean,
  automaticFeeUpdateNotice?: {
    previousFee: any,
  },
  recipient?: string, // ens name
  updatedFees?: boolean,
  feeAtTime?: string,
  warning?: string,
  completed?: number,
  feesUpdatedByUser: boolean
}

export interface SignTypedDataRequest extends Omit<AccountRequest, 'type'> {
  type: 'signTypedData',
  version: Version
}

export interface AccessRequest extends Omit<AccountRequest, 'type'> {
  type: 'access',
  address: Address
}

export interface AddChainRequest extends Omit<AccountRequest, 'type'> {
  type: 'addChain',
  chain: Chain
}

export interface SwitchChainRequest extends Omit<AccountRequest, 'type'> {
  type: 'switchChain',
  chain: Chain
}

export interface AddTokenRequest extends Omit<AccountRequest, 'type'> {
  type: 'addToken',
  token: Token
}
