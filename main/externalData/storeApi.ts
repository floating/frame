import { NATIVE_CURRENCY } from '../../resources/constants'
import { UsdRate } from '../provider/assets'
import store from '../store'

import type { Chain, Balance, Token, Rate, NativeCurrency } from '../store/state'
import { TokenBalance } from './balances/scan'

// Store API object
export const storeApi = {
  // Accounts
  getActiveAddress: () => (store('selected.current') || '') as Address,
  getAccounts: () => Object.keys(store('main.accounts') || {}) as Address[],
  getAddresses: () => Object.keys(store('main.accounts')),
  accountTokensUpdated: (address: Address) => store.accountTokensUpdated(address.toLowerCase()),

  // Networks
  getNetwork: (id: number) => (store('main.networks.ethereum', id) || {}) as Chain,
  getNativeCurrency: (id: number) =>
    (store('main.networksMeta.ethereum', id, 'nativeCurrency') || {}) as NativeCurrency,
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
    return ((store('main.balances', address) || []) as Balance[]).filter(
      (balance) => balance.address === NATIVE_CURRENCY
    ) as Balance[]
  },
  getAllBalances: () => {
    const balances = store('main.balances') || {}
    return balances as Record<Address, Balance[]>
  },
  getTokenBalances: (address: Address) => {
    const balances = (store('main.balances', address) || []) as Balance[]
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
  getInventory: (address: Address) => store('main.inventory', address.toLowerCase()) as Inventory,
  setInventory: (address: Address, inventory: Inventory) =>
    store.setInventory(address.toLowerCase(), inventory),
  setInventoryAsset: (
    address: Address,
    collectionAddress: Address,
    tokenId: string,
    asset: InventoryAsset
  ) => {
    store.setInventoryAsset(address.toLowerCase(), collectionAddress, tokenId, asset)
  },

  // Rrates
  setRates: (rates: Record<Address, UsdRate>) => store.setRates(rates),
  setTokenRates: (rates: Record<Address, UsdRate>) => store.setRates(rates),
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
