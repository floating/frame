import { NATIVE_CURRENCY } from '../../../resources/constants'

import type { Chain, Balance, Token } from '../../store/state'

export const BalancesStoreApi = (store: Store) => ({
  getActiveAddress: () => (store('selected.current') || '') as Address,
  getNetwork: (id: number) => (store('main.networks.ethereum', id) || {}) as Chain,
  getNativeCurrencySymbol: (id: number) =>
    store('main.networksMeta.ethereum', id, 'nativeCurrency', 'symbol') as string,
  getConnectedNetworks: () => {
    const networks = Object.values(store('main.networks.ethereum') || {}) as Chain[]
    return networks.filter(
      (n) => (n.connection.primary || {}).connected || (n.connection.secondary || {}).connected
    )
  },
  getCustomTokens: () => (store('main.tokens.custom') || []) as Token[],
  getKnownTokens: (address?: Address): Token[] => (address && store('main.tokens.known', address)) || [],
  getCurrencyBalances: (address: Address) => {
    return ((store('main.balances', address) || []) as Balance[]).filter(
      (balance) => balance.address === NATIVE_CURRENCY
    )
  },
  getTokenBalances: (address: Address) => {
    return ((store('main.balances', address) || []) as Balance[]).filter(
      (balance) => balance.address !== NATIVE_CURRENCY
    )
  },
  getPylonEnabled: () => true
  // store('main.pylonEnabled') as Boolean //TODO: need to add pylonEnabled to store zod def...
})
