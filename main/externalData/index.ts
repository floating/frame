import log from 'electron-log'
import Pylon from '@framelabs/pylon-client'

import store from '../store'
import Rates from './assets'
import { BalancesStoreApi } from './balances'
import { debounce } from '../../resources/utils'
import BalanceProcessor from './balances/processor'
import BalanceScanner from './balances/scanner'
import InventoryProcessor from './inventory/processor'
import Surface from './surface'
import { TokenBalance } from './balances/scan'

let pylonActive = false

import type { Chain, Token } from '../store/state'

export interface DataScanner {
  close: () => void
}

const ConnectedChains = (scanner: ReturnType<typeof BalanceScanner>, surface: ReturnType<typeof Surface>) => {
  const chains = new Set<number>()
  const notPylon = (chainId: number) => !pylonActive || !surface.networks.has(chainId)

  const connect = (chainIds: number[], activeAccount: string) => {
    log.verbose('connecting to chains...', { chainIds })
    const scanned = chainIds.filter(notPylon)
    scanned.length && scanner.addNetworks(activeAccount, chainIds)

    log.verbose('Added networks to Scanner: ', { networks: scanned })
    chainIds.forEach(chains.add.bind(chains))
  }

  const disconnect = (chainIds: number[]) => {
    log.verbose('disconnecting from chains...', { chainIds })

    const scanned = chainIds.filter(notPylon)
    scanned.length && scanner.removeNetworks(scanned)

    chainIds.forEach(chains.delete.bind(chains))
  }

  const has = chains.has.bind(chains)

  const get = () => Array.from(chains)

  return {
    has,
    disconnect,
    connect,
    get
  }
}

const externalData = function () {
  const pylon = new Pylon('wss://data.pylon.link')
  const storeApi = BalancesStoreApi(store)
  const surface = Surface()

  const balanceProcessor = BalanceProcessor(store, storeApi)
  const inventoryProcessor = InventoryProcessor(store)
  const scanner = BalanceScanner(store, storeApi, balanceProcessor)
  const connectedChains = ConnectedChains(scanner, surface)

  const notPylon = (chainId: number) => !pylonActive || !surface.networks.has(chainId)

  let activeAccount = ''
  pylonActive = storeApi.getPylonEnabled()
  let pauseScanningDelay: NodeJS.Timeout | undefined

  const activeUpdated = (current: string) => current !== activeAccount
  const toggled = (newMode: boolean) => newMode !== pylonActive

  const togglePylon = (currentMode: boolean) => {
    console.log('RUN MODE CHANGED', { newMode: currentMode, usePylon: pylonActive })
    pylonActive = currentMode
    if (!pylonActive) {
      surface.stop()
      scanner.addNetworks(activeAccount, connectedChains.get())
    } else {
      scanner.removeNetworks(Array.from(surface.networks))
      surface.updateSubscribers(store, balanceProcessor, inventoryProcessor)
    }
  }

  const updateActiveAccount = (currentAccount: string) =>
    debounce(() => {
      log.verbose('updating external data due to address update(s)', { activeAccount })
      if (!currentAccount) return
      rates.updateSubscription(connectedChains.get(), activeAccount)
      if (!activeAccount) {
        scanner.start() //TODO: could conditionally start?....
        activeAccount = currentAccount
        pylonActive = storeApi.getPylonEnabled()
        scanner.setAddress(currentAccount)
        const currentNetworks = storeApi.getConnectedNetworks().map((network) => network.id)
        const toScan = currentNetworks.filter(notPylon)
        console.log('hadling setup for networks...', { networks: toScan, account: currentAccount })
        if (toScan.length > 0) {
          scanner.addNetworks(currentAccount, toScan)
        }

        return
      }

      console.log('Active account has switched... updating to new account', {
        newActiveAccount: currentAccount
      })

      scanner.setAddress(currentAccount)
      activeAccount = currentAccount
    }, 800)()

  const handleAccountChanges = () =>
    debounce(() => {
      if (pylonActive) {
        surface.updateSubscribers(store, balanceProcessor, inventoryProcessor)
      }
    }, 800)()

  const handleTokensUpdate = debounce((tokens: Token[]) => {
    log.verbose('updating external data due to token update(s)', { activeAccount })

    const [forProcessor, forScanner] = tokens.reduce(
      ([forProcessor, forScanner], token) => {
        return pylonActive && surface.networks.has(token.chainId)
          ? [forProcessor.concat(token), forScanner]
          : [forProcessor, forScanner.concat(token)]
      },
      [[] as Token[], [] as Token[]]
    )

    scanner.addTokens(activeAccount, forScanner)
    //TODO: Map into balances
    const balances: TokenBalance[] = []
    //TODO: use processor to update these balances directly...

    rates.updateSubscription(
      storeApi.getConnectedNetworks().map((network) => network.id),
      activeAccount
    )
  })

  const rates = Rates(pylon, store)
  console.log('starting balance provider...', { runMode: pylonActive })
  if (pylonActive) {
    console.log('PYLON SELECTED... SETTING UP SUBSCRIPTIONS...')
    surface.updateSubscribers(store, balanceProcessor, inventoryProcessor)
  }

  const handleNetworkChanges = (networks: number[]) =>
    debounce(() => {
      console.log('handling network changes...', {
        networks,
        activeAccount,
        connectedChains: connectedChains.get()
      })
      const set = new Set(networks)

      const added = networks.filter((id) => !connectedChains.has(id))
      const removed = connectedChains.get().filter((id) => !set.has(id))
      connectedChains.disconnect(removed)
      connectedChains.connect(added, activeAccount)
      if (added.length || removed.length) rates.updateSubscription(connectedChains.get(), activeAccount)
    }, 800)()

  //TODO: remove...
  setTimeout(() => {
    console.log('SWITCHCHING TO PYLON...')
    store.setBalanceMode('pylon')
  }, 15_000)

  rates.start()

  const activeAddressObserver = store.observer(() => {
    const currentActive = storeApi.getActiveAddress()
    if (activeUpdated(currentActive)) {
      updateActiveAccount(currentActive)
    }
  }, 'externalData:activeAccount')

  const accountsObserver = store.observer(() => {
    handleAccountChanges()
  }, 'externalData:accounts')

  const tokensObserver = store.observer(() => {
    const customTokens = storeApi.getCustomTokens()
    //TODO: handle known tokens...
    const knownTokens = storeApi.getKnownTokens(activeAccount)
    handleTokensUpdate(customTokens)
  }, 'externalData:tokens')

  const usePylonObserver = store.observer(() => {
    const currentMode = storeApi.getPylonEnabled()

    if (toggled(currentMode)) {
      togglePylon(currentMode)
    }
  }, 'externalData:usePylon')

  const networksObserver = store.observer(() => {
    const currentNetworks = storeApi.getConnectedNetworks().map(({ id }) => id)
    log.verbose({ currentNetworks })
    handleNetworkChanges(currentNetworks)
  }, 'externalData:networks')

  const trayObserver = store.observer(() => {
    const open = store('tray.open')

    if (!open) {
      // pause balance scanning after the tray is out of view for one minute
      if (!pauseScanningDelay) {
        pauseScanningDelay = setTimeout(() => {
          scanner.pause()
        }, 1000)
      }
    } else {
      if (pauseScanningDelay) {
        clearTimeout(pauseScanningDelay)
        pauseScanningDelay = undefined

        scanner.resume()
      }
    }
  }, 'externalData:tray')

  return {
    close: () => {
      activeAddressObserver.remove()
      tokensObserver.remove()
      accountsObserver.remove()
      usePylonObserver.remove()
      trayObserver.remove()
      networksObserver.remove()

      scanner.stop()
      surface.close()
      rates.stop()

      if (pauseScanningDelay) {
        clearTimeout(pauseScanningDelay)
      }
    }
  } as DataScanner
}

export default externalData
