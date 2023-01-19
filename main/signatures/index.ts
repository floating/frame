import { TypedMessage, TypedSignatureRequestType } from '../accounts/types'
import signatureTypes from './types'
import { SignTypedDataVersion, MessageTypeProperty } from '@metamask/eth-sig-util'

export const identify = ({ data }: TypedMessage<SignTypedDataVersion>): TypedSignatureRequestType => {
  const identified = Object.entries(signatureTypes).find(([requestType, { name, properties }]) => {
    if (!('types' in data)) return false
    if (!(name in data.types) || !Array.isArray(data.types[name])) return false

    const messageProperties = data.types[name] as MessageTypeProperty[]
    return (
      messageProperties.length === properties.length &&
      properties.every(({ name, type }) =>
        Boolean(messageProperties.find((item) => item.name === name && item.type === type))
      )
    )
  })

  return identified ? (identified[0] as TypedSignatureRequestType) : 'signTypedData'
}

export { isSignatureRequest } from '../../resources/domain/request'
