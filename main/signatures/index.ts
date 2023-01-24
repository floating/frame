import { Permit, PermitSignatureRequest, TypedMessage, TypedSignatureRequestType } from '../accounts/types'
import signatureTypes from './types'
import { SignTypedDataVersion, MessageTypeProperty } from '@metamask/eth-sig-util'
import { EIP712MessageDomain } from '@ledgerhq/hw-app-eth/lib/modules/EIP712/EIP712.types'

const matchesMsgType = (properties: MessageTypeProperty[], required: MessageTypeProperty[]) =>
  properties.length === required.length &&
  required.every(({ name, type }) =>
    Boolean(properties.find((item) => item.name === name && item.type === type))
  )

const matchesDomainFilter = (domain: EIP712MessageDomain, domainFilter: string[]) =>
  domainFilter.every((property) => property in domain)

export const identify = ({ data }: TypedMessage<SignTypedDataVersion>): TypedSignatureRequestType => {
  const identified = Object.entries(signatureTypes).find(([, { domainFilter, types: requiredTypes }]) => {
    if (!('types' in data)) return

    return Object.entries(requiredTypes).every(
      ([name, properties]) =>
        data.types[name] &&
        matchesMsgType(properties, data.types[name]) &&
        matchesDomainFilter(data.domain as EIP712MessageDomain, domainFilter)
    )
  })

  return identified ? (identified[0] as TypedSignatureRequestType) : 'signTypedData'
}

export const parsePermit = (req: PermitSignatureRequest): Permit => {
  const {
    typedMessage: {
      data: {
        message: { deadline, spender, value, owner, nonce },
        domain: { verifyingContract, chainId }
      }
    }
  } = req

  return {
    deadline,
    spender,
    value,
    owner,
    verifyingContract,
    chainId,
    nonce
  }
}

export { isSignatureRequest } from '../../resources/domain/request'
