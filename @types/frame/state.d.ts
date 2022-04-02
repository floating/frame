interface Connection {
  on: boolean,
  connected: boolean,
  current: string,
  status: string,
  network: string,
  custom: string
}

interface Network {
  id: number,
  name: string,
  symbol: string,
  layer: string,
  on: boolean,
  connection: {
    primary: Connection,
    secondary: Connection
  }
}

interface NetworkMetadata {
  id: number,
  name: string,
  nativeCurrency: NativeCurrency,
  symbol: string,
  gas: GasData
}

interface Permission {
  origin: string,
  provider: boolean, // whether or not to grant access
  handlerId?: string
}

interface NativeCurrency {
  symbol: string
}

interface GasData {
  fees: GasFees,
  price: {
    selected: string,
    levels: GasLevels
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

interface Balance {
  chainId: number,
  address: Address,
  name: string,
  symbol: string,
  balance: string,
  decimals: number,
  displayBalance: string
}

interface Rate {
  usd: {
    price: BigNumber,
    change24hr: BigNumber
  }
}

interface Currency {
  icon: string,
  name: string,
  usd: {
    price: number,
    change24hr: number
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
  id: string,
  ens: string,
  status: string,
  config: string,
  manifest: any,
  current: any
}

type SignerType = 'ring' | 'seed' | 'aragon' | 'trezor' | 'ledger' | 'lattice' | 'keystone'
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
  smart?: any,
  requests: Record<string, any>,
  ensName: string,
  created: string
}
