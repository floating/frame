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

export function getAvailableSigner (signer: Signer, lastSignerType: Type, getSigners: () => Signer[], cb: Callback<Signer>) {
  const isSignerReady = ({ status }: Signer) => status === 'ok'

  if (!signer) {
    // if no signer is active, check if this account was previously relying on a
    // hardware signer that is currently disconnected
    if (isHardwareSigner(lastSignerType)) {
      const unavailableSigners = getSigners()
          .filter(signer => getSignerType(signer.type) === lastSignerType && !isSignerReady(signer))

      // if there is only one matching disconnected signer, open the signer panel so it can be unlocked
      // when there are more than one matching signer, open the account panel so the user can choose
      if (unavailableSigners.length) {
        return cb(new Error('Signer unavailable'), unavailableSigners.length === 1 ? unavailableSigners[0] : undefined)
      }
    }

    return cb(new Error('No signer'))
  }

  if (!isSignerReady(signer)) {
    // if the signer is not ready to sign, open the signer panel so that
    // the user can unlock it or reconnect
    return cb(new Error('Signer unavailable'), signer)
  }

  return cb(null, signer)
}
