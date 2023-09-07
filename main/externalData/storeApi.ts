import store from '../store'
import { NATIVE_CURRENCY } from '../../resources/constants'

import type {
  Chain,
  Token,
  Rate,
  InventoryAsset,
  Inventory,
  TokenBalance,
  Account
} from '../store/state/types'

export const storeApi = {
  // Accounts
  getActiveAddress: () => {
    const accounts = Object.values(store('main.accounts')) as Account[]
    return accounts.find((acct: Account) => acct.active)?.id || ''
    const currentAccount: Account | undefined = accounts.find((acct: Account) => acct.active)
    return (currentAccount?.id || '') as Address
  },
  getAccounts: () => Object.keys(store('main.accounts') || {}) as Address[],
  getAddresses: () => {
    const addresses = Object.keys(store('main.accounts') || {})
    return addresses as Address[]
  },
  setAccountTokensUpdated: (address: Address) => store.accountTokensUpdated(address.toLowerCase()),

  // Networks
  getNetwork: (id: number) => (store('main.networks.ethereum', id) || {}) as Chain,
  getNetworks: () => {
    return Object.values(store('main.networks.ethereum') || {}) as Chain[]
  },
  getNativeCurrency: (id: number) =>
    (store('main.networksMeta.ethereum', id, 'nativeCurrency') || {}) as TokenBalance,
  getConnectedNetworks: () => {
    const networks = Object.values(store('main.networks.ethereum') || {}) as Chain[]
    return networks.filter(
      (n) => (n.connection.primary || {}).connected || (n.connection.secondary || {}).connected
    )
  },
  getConnectedNetworkIds: () => {
    const networks = Object.values(store('main.networks.ethereum') || {}) as Chain[]
    return networks.reduce((acc, n) => {
      if ((n.connection.primary || {}).connected || (n.connection.secondary || {}).connected) {
        acc.push(n.id)
      }
      return acc
    }, [] as number[])
  },
  getEnabledNetworkIds: () => {
    const networks = Object.values(store('main.networks.ethereum') || {}) as Chain[]
    return networks.filter((n) => n.on).map((n) => n.id)
  },

  // Tokens
  getCustomTokens: () => (store('main.tokens.custom') || []) as Token[],
  getKnownTokens: (address?: Address): Token[] => (address && store('main.tokens.known', address)) || [],
  getAllKnownTokens: () => {
    const knownTokens = store('main.tokens.known') || {}
    return knownTokens as Record<Address, Token[]>
  },
  removeKnownTokens: (address: Address, tokens: Set<string>) =>
    store.removeKnownTokens(address.toLowerCase(), tokens),
  addKnownTokens: (address: Address, tokens: TokenBalance[]) =>
    store.addKnownTokens(address.toLowerCase(), tokens),

  // Blances
  getCurrencyBalances: (address: Address) => {
    return ((store('main.balances', address) || []) as TokenBalance[]).filter(
      (balance) => balance.address === NATIVE_CURRENCY
    ) as TokenBalance[]
  },
  getAllBalances: () => {
    const balances = store('main.balances') || {}
    return balances as Record<Address, TokenBalance[]>
  },
  getTokenBalances: (address: Address) => {
    const balances = (store('main.balances', address) || []) as TokenBalance[]
    return balances.filter((balance) => balance.address !== NATIVE_CURRENCY) as TokenBalance[]
  },
  setBalances: (address: Address, balances: TokenBalance[]) =>
    store.setBalances(address.toLowerCase(), balances),
  setBalance: (address: Address, balance: TokenBalance) => {
    store.setBalance(address.toLowerCase(), balance)
  },
  removeBalances: (address: Address, tokens: Set<string>) =>
    store.removeBalances(address.toLowerCase(), tokens),

  // Methods related to inventory
  getInventory: (address: Address) => (store('main.inventory', address.toLowerCase()) || {}) as Inventory,
  setInventory: (address: Address, inventory: Inventory) =>
    store.setInventory(address.toLowerCase(), inventory),
  setInventoryAssets: (address: Address, collectionAddress: Address, assets: InventoryAsset[]) => {
    store.setInventoryAssets(address.toLowerCase(), collectionAddress, assets)
  },

  // Rates
  setTokenRates: (rates: Record<Address, Record<string, Rate>>) => store.setRates(rates),
  getTokenRates: () => store('main.rates') as Record<Address, Record<string, Rate>>,
  removeTokenRate: (address: Address) => store.removeRate(address),
  setNativeCurrencyRate: (chainId: number, rate: Rate) =>
    store.setNativeCurrencyData('ethereum', chainId, { usd: rate }),
  removeNativeCurrencyRate: (chainId: number) => store.removeNativeCurrencyRate('ethereum', chainId),

  // Chains
  addPopulatedChains: (address: Address, chains: number[], expiryWindow: number) =>
    store.addPopulatedChains(address.toLowerCase(), chains, expiryWindow),

  //Misc
  getTrayOpened: () => store('tray.open')
}
