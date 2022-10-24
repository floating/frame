export function isHardwareSigner (type = '') {
  return ['ledger', 'trezor', 'lattice'].includes(type.toLowerCase())
}
