import { getSignerDisplayType } from "../signer"

export const accountNS = '114c39e5-cd7d-416f-ab9e-5ab6ab0218ce'

export const isDefaultAccountName = ({ name, lastSignerType }: Account) => name.toLowerCase() === getDefaultAccountName(lastSignerType)

export const getDefaultAccountName = (type: string) => `${getSignerDisplayType(type)} account`

export function accountSort (a: Account, b:Account) {
  try {
    const [aBlockStr, aLocalStr] = a.created.split(':')
    const [bBlockStr, bLocalStr] = b.created.split(':')

    const aLocal = parseInt(aLocalStr)
    const bLocal = parseInt(bLocalStr)

    if (aBlockStr === 'new' && bBlockStr !== 'new') return -1
    if (bBlockStr !== 'new' && aBlockStr === 'new') return 1
    if (aBlockStr === 'new' && bBlockStr === 'new') return bLocal - aLocal

    const aBlock = parseInt(aBlockStr)
    const bBlock = parseInt(bBlockStr)

    return bBlock-aBlock
  } catch (e) {
    console.error(e)
    return 0
  }
}
