interface Connection {
  on: boolean,
  connected: boolean,
  current: string,
  status: string,
  network: string,
  custom: string
}

interface Chain {
  id: number,
  type: 'ethereum'
}

interface Network {
  id: number
  name: string
  layer: string
  isTestnet: boolean
  explorer: string
  on: boolean
  connection: {
    primary: Connection
    secondary: Connection
  }
}

interface NetworkMetadata {
  blockHeight: number
  gas: GasData
  icon: string
  primaryColor: keyof ColorwayPalette
  nativeCurrency: NativeCurrency
}

interface Session {
  requests: number,
  startedAt: number,
  endedAt?: number,
  lastUpdatedAt: number
}

interface Origin {
  chain: Chain,
  name: string,
  session: Session
}

interface Permission {
  origin: string
  provider: boolean // whether or not to grant access
  handlerId?: string
}

interface NativeCurrency {
  symbol: string
  icon: string
  name: string
  decimals: number
}

interface GasData {
  fees: GasFees,
  price: {
    selected: string,
    levels: GasLevels,
    fees: GasFees | null
  }
}

interface GasFees {
  nextBaseFee: string,
  maxBaseFeePerGas: string,
  maxPriorityFeePerGas: string,
  maxFeePerGas: string
}

interface GasLevels {
  slow?: string,
  standard: string,
  fast?: string,
  asap?: string,
  custom?: string
}

type HexAmount = string

enum Colorway { light = 'light', dark = 'dark' }

type Color = { r: number, g: number, b: number }
type ColorwayPalette = {
  accent1: Color
  accent2: Color
  accent3: Color
  accent4: Color
  accent5: Color
  accent6: Color
  accent7: Color
  accent8: Color
}

interface Balance {
  chainId: number,
  address: Address,
  name: string,
  symbol: string,
  balance: HexAmount,
  decimals: number,
  displayBalance: string
}

interface Rate {
  usd: {
    price: BigNumber,
    change24hr: BigNumber
  }
}

interface Token {
  chainId: number,
  name: string,
  symbol: string,
  address: string,
  decimals: number,
  logoURI?: string
}

type InventoryAsset = {
  name: string
  [field: string]: any
}

type InventoryCollection = {
  meta: any,
  items: Record<string, InventoryAsset>
}

type Inventory = Record<string, InventoryCollection>

interface ViewMetadata {
  id: string,
  ready: boolean,
  dappId: string,
  ens: string,
  url: string
}

interface Frame {
  id: string,
  currentView: string,
  views: Record<string, ViewMetadata>
}

interface Dapp {
  id?: string,
  ens: string,
  status?: string,
  config: Record<string, string>,
  manifest?: any,
  current?: any
}

type SignerType = 'ring' | 'seed' | 'aragon' | 'trezor' | 'ledger' | 'lattice'
type AccountStatus = 'ok'

interface Signer {
  id: string,
  name: string,
  model: string,
  type: SignerType,
  addresses: Address[],
  status: string,
  createdAt: number
}

interface Account {
  id: string,
  name: string,
  lastSignerType: SignerType,
  active: boolean,
  address: Address,
  status: AccountStatus,
  signer: string,
  smart?: SmartAccount,
  requests: Record<string, any>,
  ensName: string,
  created: string,
  balances: {
    lastUpdated?: number
  }
}

interface SmartAccount {
  name: string,
  chain: Chain,
  type: string,
  actor: any, // TODO: is this an address or an object?
  agent: Address,
  ens: string,
  apps: any,
  dao: any
}
