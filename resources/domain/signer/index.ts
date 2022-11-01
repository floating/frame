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

export function isHardwareSigner (typeOrSigner: string | Signer = '') {
  const signerType = (typeof typeOrSigner === 'string') ? typeOrSigner : (typeOrSigner as Signer).type

  return ['ledger', 'trezor', 'lattice'].includes(signerType.toLowerCase())
}

export function isSignerReady (signer: Signer) {
  return signer.status === 'ok'
}

export function findUnavailableSigners (signerTypeValue: string, signers: Signer[]): Signer[] {
  if (!isHardwareSigner(signerTypeValue)) return []

  return signers.filter(signer => signer.type === signerTypeValue && !isSignerReady(signer))
}
