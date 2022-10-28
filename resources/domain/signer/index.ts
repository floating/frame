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
  return ['ring', 'seed'].includes(signer.type.toLowerCase()) ? 'hot' : signer.type
}

export function isHardwareSignerType (type = '') {
  return ['ledger', 'trezor', 'lattice'].includes(type.toLowerCase())
}

export function isSignerReady (signer: Signer) {
  return signer.status === 'ok'
}

export function findUnavailableSigners (signerTypeValue: string, signers: Signer[]): Signer[] {
  if (!isHardwareSignerType(signerTypeValue)) return []

  return signers.filter(signer => signer.type === signerTypeValue && !isSignerReady(signer))
}
