interface ChainId {
  id: number
  type: 'ethereum'
}

interface Session {
  requests: number
  startedAt: number
  endedAt?: number
  lastUpdatedAt: number
}

interface Origin {
  chain: ChainId
  name: string
  session: Session
}

interface Permission {
  origin: string
  provider: boolean // whether or not to grant access
  handlerId?: string
}

type HexAmount = string

enum Colorway {
  light = 'light',
  dark = 'dark'
}

interface WithTokenId {
  address: string
  chainId: number
}

interface Balance extends WithTokenId {
  name: string
  symbol: string
  balance: HexAmount
  decimals: number
  displayBalance: string
}

interface Token extends WithTokenId {
  name: string
  symbol: string
  decimals: number
  logoURI?: string
}

type InventoryAsset = {
  name: string
  [field: string]: any
}

type InventoryCollection = {
  meta: any
  items: Record<string, InventoryAsset>
}

type Inventory = Record<string, InventoryCollection>

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

interface Dapp {
  id?: string
  ens: string
  status?: string
  config: Record<string, string>
  content?: string // IPFS hash
  manifest?: any
  current?: any
  openWhenReady: boolean
  checkStatusRetryCount: number
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
