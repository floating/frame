import { NATIVE_CURRENCY } from '../../../resources/constants'
import Processor from './processor'
import Scanner from './scanner'
import surface from '../surface'

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
  getBalanceMode: () => store('main.balanceFetchMode') || 'pylon' //TODO: need to add balanceFetchMode to store zod def...
})

//TODO: handle balances overwriting eachother
function BalanceProvider(store: Store, storeApi: ReturnType<typeof BalancesStoreApi>) {
  const enabledChains = new Set<number>(storeApi.getConnectedNetworks().map((network) => network.id))
  const pylonChains = new Set()

  //TODO:....
  // const observer = store.observer(() => {
  //   //Handle cases where enabled networks changes
  //   //Handle cases where active account changes
  //   // Handle cases where balance mode changes
  //   // Handle cases where accounts change
  // })

  let runMode = storeApi.getBalanceMode()

  let activeAccount = storeApi.getActiveAddress()

  const processor = Processor(store, storeApi)
  const scanner = Scanner(store, storeApi, processor)

  const usingScanner = () => runMode === 'scan'
  const usingPylon = () => runMode === 'pylon'
  const runModeChanged = (newMode: string) => newMode !== runMode

  const start = () => {
    scanner.start() //TODO: could conditionally start....
    console.log('starting balance provider...', { runMode })
    if (usingPylon()) {
      console.log('pylon is selected - updating subscribers...')
      surface.getChains().forEach((chain) => {
        pylonChains.add(chain)
      })
      surface.updateSubscribers(store, processor)
    }

    //TODO: handle chains changing...
  }

  const handleActiveAccountChanged = (currentAccount: string) => {
    if (!currentAccount) return
    if (!activeAccount) {
      const notPylon = Array.from(enabledChains).filter((chain) => !pylonChains.has(chain))
      console.log('hadling setup for networks...', { networks: notPylon, account: currentAccount })
      if (notPylon.length > 0) {
        scanner.addNetworks(currentAccount, notPylon)
      }
    }
    if (activeAccount !== currentAccount) {
      console.log('Active account has switched... updating to new account', {
        newActiveAccount: currentAccount
      })
      scanner.setAddress(currentAccount)
      activeAccount = currentAccount
    }
  }

  const handleNewChains = (newChains: number[]) => {
    const toAdd = newChains.filter((chain) => !enabledChains.has(chain) && !pylonChains.has(chain))
    if (toAdd.length > 0) {
      console.log('adding new chains...', { chains: toAdd, account: activeAccount })
      scanner.addNetworks(activeAccount, toAdd)
    }
  }

  const updatePylonAccounts = () => {
    if (usingPylon()) {
      surface.updateSubscribers(store, processor)
    }
  }

  const handleRunModeChanged = (currentMode: string) => {
    if (runModeChanged(currentMode)) {
      console.log('RUN MODE CHANGED', { newMode: currentMode, runMode })
      runMode = currentMode
      if (usingScanner()) {
        surface.stop()
        scanner.addNetworks(activeAccount, Array.from(enabledChains))
        pylonChains.clear()
      } else {
        const pylonEnabled = surface.getChains()
        pylonEnabled.forEach((chain) => {
          pylonChains.add(chain)
        })
        scanner.removeNetworks(pylonEnabled)
      }
    }

    updatePylonAccounts()
  }

  const pauseScanner = () => scanner.pause()
  const resumeScanner = () => scanner.resume()
  const stop = () => {
    scanner.stop()
    surface.stop()
  }

  return {
    start,
    handleActiveAccountChanged,
    handleNewChains,
    pauseScanner,
    resumeScanner,
    stop,
    handleRunModeChanged
  }
}

export default BalanceProvider
