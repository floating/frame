import type { SignatureRequestType } from '../../../main/accounts/types'
import { capitalize } from '../../utils'

export const isCancelableRequest = (status: string): Boolean => {
  return !['sent', 'sending', 'verifying', 'confirming', 'confirmed', 'error', 'declined'].includes(status)
}

export const getSignatureRequestClass = ({ status = '' }) => `signerRequest ${capitalize(status)}`

export const isSignatureRequest = (requestType: string): requestType is SignatureRequestType => {
  return ['sign', 'signTypedData', 'signErc20Permit'].includes(requestType)
}
