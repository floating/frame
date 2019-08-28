const namehash = require('eth-ens-namehash')

const knownApps = [
  'voting',
  'token-manager',
  'finance',
  'vault',
  'agent',
  'survey',
  'payroll',
  'kernel',
  'acl',
  'evmreg',
  'apm-registry',
  'apm-repo',
  'apm-enssub'
]

const hashes = {}
knownApps.forEach(app => { hashes[namehash.hash(`${app}.aragonpm.eth`)] = app })
module.exports = hashes
