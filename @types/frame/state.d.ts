interface Network {
  id: number,
  name: string,
  symbol: string,
  layer: string,
  on: boolean
}

interface NetworkMetadata {
  id: number,
  name: string,
  nativeCurrency: NativeCurrency,
  symbol: string,
  gas: GasData
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
  views: { [id: string]: ViewMetadata }
}

interface Dapp {
  id: string,
  ens: string,
  status: string,
  config: string,
  manifest: any,
  current: any
}
