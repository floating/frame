import { getSignerDisplayType } from '../signer'

export const accountNS = '114c39e5-cd7d-416f-ab9e-5ab6ab0218ce'

export const isDefaultAccountName = ({ name, lastSignerType }: Account) => {
  if (!lastSignerType) {
    return false
  }
  const signerDisplayTypeMap = {
    ring: () => name.toLowerCase() === 'hot account',
    seed: () => name.toLowerCase() === 'hot account',
    address: () => ['address account', 'watch account'].includes(name.toLowerCase()), // address type accounts can be displayed as 'address' (beta.22) or 'watch' accounts (omnichain onwards)
    trezor: () => name.toLowerCase() === 'trezor account',
    ledger: () => name.toLowerCase() === 'ledger account',
    lattice: () => name.toLowerCase() === 'lattice account'
  }
  const signerDisplayTypeCheckFunc =
    signerDisplayTypeMap[lastSignerType.toLowerCase() as keyof typeof signerDisplayTypeMap]

  return signerDisplayTypeCheckFunc ? signerDisplayTypeCheckFunc() : false
}

export const getDefaultAccountName = (type: string) => `${getSignerDisplayType(type)} account`

export function accountSort(a: Account, b: Account) {
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

    return bBlock - aBlock
  } catch (e) {
    console.error(e)
    return 0
  }
}
