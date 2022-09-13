import { TypedDataV1, TypedMessage, MessageTypes, SignTypedDataVersion } from '@metamask/eth-sig-util'

export function getVersionFromTypedData (typedData: TypedDataV1 | TypedMessage<MessageTypes>) {
  if (Array.isArray(typedData)) {
    return SignTypedDataVersion.V1
  }

  const hasUndefinedType = () => typedData.types[typedData.primaryType].some(({ name }) => typedData.message[name] === undefined)
  const containsArrays = () => Object.values(typedData.types).flat().some(({ type }) => type.endsWith('[]'))

  try {
    // arrays only supported by v4
    if (containsArrays()) {
      return SignTypedDataVersion.V4
    }

    // no v4-specific features so could use either v3 or v4 - default to v4 unless data contains undefined types (invalid in v4)
    return hasUndefinedType() ? SignTypedDataVersion.V3 : SignTypedDataVersion.V4
  } catch (e) {
    // parsing error - default to v4
    return SignTypedDataVersion.V4
  }
}
