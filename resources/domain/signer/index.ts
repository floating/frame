import type FrameAccount from '../../../main/accounts/Account'
import type Signer from '../../../main/signers/Signer'

// in order of increasing priority
export enum Type {
  Ring = 'ring',
  Seed = 'seed',
  Aragon = 'aragon',
  Trezor = 'trezor',
  Ledger = 'ledger',
  Lattice = 'lattice'
}

export function getSignerType (typeValue: string) {
  return Object.values(Type).find(type => type === typeValue)
}

export function getSignerDisplayType (signer: Signer) {
  return ['ring', 'seed'].includes((signer.type || '').toLowerCase()) ? 'hot' : signer.type
}

export function isHardwareSigner (type = '') {
  return ['ledger', 'trezor', 'lattice'].includes(type.toLowerCase())
}

export function checkSignerAvailability (signer: Signer, lastSignerType: Type, getSigners: () => Signer[], cb: Callback<Signer>) {
  const isHardware = isHardwareSigner(lastSignerType)

  // handle locked and other states requiring user action
  if (isHardware && !signer) {
    const unavailableSigners = (getSigners() as Signer[])
      .filter(({ type, status }) => getSignerType(type) === lastSignerType && status !== 'ok')

    if (unavailableSigners.length) {
      return cb(new Error('Signer unavailable'), unavailableSigners[0])
    }
  }

  if (signer && signer.status !== 'ok') {
    return cb(new Error('Signer unavailable'), signer)
  }
  
  // missing signers
  if (!signer) {
    return cb(new Error('No signer'), undefined)
  }

  return cb(null, signer)
}
