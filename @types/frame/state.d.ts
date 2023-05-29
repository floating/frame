type HexAmount = string

interface ViewMetadata {
  id: string
  ready: boolean
  dappId: string
  ens: string
  url: string
}

interface Frame {
  id: string
  currentView: string
  views: Record<string, ViewMetadata>
}

type SignerType = 'ring' | 'seed' | 'trezor' | 'ledger' | 'lattice'
type AccountStatus = 'ok'

interface Signer {
  id: string
  name: string
  model: string
  type: SignerType
  addresses: Address[]
  status: string
  createdAt: number
}

interface Account {
  id: string
  name: string
  lastSignerType: SignerType
  active: boolean
  address: Address
  status: AccountStatus
  signer: string
  requests: Record<string, any>
  ensName: string
  created: string
  balances: {
    lastUpdated?: number
  }
}
