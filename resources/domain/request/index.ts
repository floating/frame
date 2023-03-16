import type {
  AccountRequest,
  RequestType,
  SignatureRequest,
  SignTypedDataRequest,
  TransactionRequest
} from '../../../main/accounts/types'
import { capitalize } from '../../utils'

export const isCancelableRequest = (status: string): boolean => {
  return !['sent', 'sending', 'verifying', 'confirming', 'confirmed', 'error', 'declined'].includes(status)
}

export const getSignatureRequestClass = ({ status = '' }) => `signerRequest ${capitalize(status)}`

export const isSignatureRequest = (request: AccountRequest): request is SignatureRequest => {
  return ['sign', 'signTypedData', 'signErc20Permit'].includes(request.type)
}

export const isTransactionRequest = (request: AccountRequest): request is TransactionRequest =>
  request.type === 'transaction'

export const isTypedMessageSignatureRequest = (request: AccountRequest): request is SignTypedDataRequest =>
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
