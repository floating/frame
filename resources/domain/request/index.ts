import type {
  AccountRequest,
  RequestType,
  SignatureRequestType,
  SignTypedDataRequest,
  TransactionRequest
} from '../../../main/accounts/types'
import { capitalize } from '../../utils'

export const isCancelableRequest = (status: string): Boolean => {
  return !['sent', 'sending', 'verifying', 'confirming', 'confirmed', 'error', 'declined'].includes(status)
}

export const getSignatureRequestClass = ({ status = '' }) => `signerRequest ${capitalize(status)}`

export const isSignatureRequestType = (requestType: string): requestType is SignatureRequestType => {
  return ['sign', 'signTypedData', 'signErc20Permit'].includes(requestType)
}

export const isTransactionRequest = (request: AccountRequest): request is TransactionRequest =>
  request.type === 'transaction'

export const isTypedMessageSignatureReqest = (request: AccountRequest): request is SignTypedDataRequest =>
  ['signTypedData', 'signErc20Permit'].includes(request.type)

export const accountViewTitles: Record<RequestType, string> = {
  sign: 'Sign Mesage',
  signTypedData: 'Sign Data',
  signErc20Permit: 'Sign Token Permit',
  transaction: 'Sign Transaction',
  access: 'Account Access',
  addChain: 'Add Chain',
  switchChain: 'Switch Chain',
  addToken: 'Add Token'
}
