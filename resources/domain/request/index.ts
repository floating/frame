import { SignTypedDataVersion } from '@metamask/eth-sig-util'
import type { SignatureRequestType, TypedMessage } from '../../../main/accounts/types'

export const isCancelableRequest = (status: string): Boolean => {
  return !['sent', 'sending', 'verifying', 'confirming', 'confirmed', 'error', 'declined'].includes(status)
}

const permitTypes = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' }
]

export const isEip2612Permit = ({ data }: TypedMessage<SignTypedDataVersion>) => {
  if (!('types' in data)) return false
  if (!('Permit' in data.types) || !Array.isArray(data.types.Permit)) return false
  const { Permit } = data.types

  return (
    Permit.length === permitTypes.length &&
    permitTypes.every(({ name, type }) =>
      Boolean(Permit.find((item) => item.name === name && item.type === type))
    )
  )
}

export const isSignatureRequest = (requestType: string): requestType is SignatureRequestType => {
  return ['sign', 'signTypedData', 'signErc20Permit'].includes(requestType)
}
