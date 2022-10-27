import Signer from '../../../main/signers/Signer'

export function getSignerType (signer: Signer) {
  return ['ring', 'seed'].includes((signer.type || '').toLowerCase()) ? 'hot' : signer.type
}

export function isHardwareSigner (type = '') {
  return ['ledger', 'trezor', 'lattice'].includes(type.toLowerCase())
}
