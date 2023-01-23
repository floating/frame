import { MessageTypeProperty } from '@metamask/eth-sig-util'

interface LabelledSignatureType {
  domainFilter: string[]
  types: { [key: string]: MessageTypeProperty[] }
}

const eip612Permit: LabelledSignatureType = {
  types: {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  },
  domainFilter: ['chainId']
}

const signatureTypes: { [key: string]: LabelledSignatureType } = {
  signErc20Permit: eip612Permit
}

export default signatureTypes
