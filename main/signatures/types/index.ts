import { TypedSignatureRequestType } from '../../accounts/types'
import { MessageTypeProperty } from '@metamask/eth-sig-util'

interface LabelledMessageType {
  name: string
  properties: MessageTypeProperty[]
}

const eip612Permit: LabelledMessageType = {
  name: 'Permit',
  properties: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
}

const signatureTypes: { [key: string]: LabelledMessageType } = {
  signErc20Permit: eip612Permit
}

export default signatureTypes
