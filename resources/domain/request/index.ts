import type { RequestType, SignatureRequestType } from '../../../main/accounts/types'
import { capitalize } from '../../utils'

export const isCancelableRequest = (status: string): Boolean => {
  return !['sent', 'sending', 'verifying', 'confirming', 'confirmed', 'error', 'declined'].includes(status)
}

export const getSignatureRequestClass = ({ status = '' }) => `signerRequest ${capitalize(status)}`

export const isSignatureRequest = (requestType: string): requestType is SignatureRequestType => {
  return ['sign', 'signTypedData', 'signErc20Permit'].includes(requestType)
}

export const accountViewTitles: Record<RequestType, string> = {
  sign: 'Sign Mesage',
  signTypedData: 'Sign Data',
  signErc20Permit: 'Sign Token Spend Permit',
  transaction: 'Sign Transaction',
  access: 'Account Access',
  addChain: 'Add Chain',
  switchChain: 'Switch Chain',
  addToken: 'Add Token'
}
