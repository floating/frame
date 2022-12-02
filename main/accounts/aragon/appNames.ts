import namehash from 'eth-ens-namehash'

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

const hashes = Object.fromEntries(knownApps.map((app) => [namehash.hash(`${app}.aragonpm.eth`), app]))

export default hashes
