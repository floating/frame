import log from 'electron-log'
import Pylon from '@framelabs/pylon-api-client'

import store from '../store'
import Rates from './assets'
import { BalancesStoreApi } from './balances'
import { debounce } from '../../resources/utils'
import BalanceProcessor from './balances/processor'
import BalanceScanner from './balances/scanner'
import InventoryProcessor from './inventory/processor'
import surface from './surface'

import type { TokenBalance } from './balances/scan'

let pylonActive = false
let activeAccount = ''

const activeUpdated = (current: string) => current !== activeAccount
const usePylonUpdated = (newMode: boolean) => newMode !== pylonActive

import type { Token } from '../store/state'

export interface DataScanner {
  close: () => void
}

const ConnectedChains = (scanner: ReturnType<typeof BalanceScanner>) => {
  const connected = new Set<number>()

  const notPylon = (chainId: number) => !pylonActive || !surface.networks.has(chainId)

  const update = (chainIds: number[]) => {
    log.verbose('updating connection to chains...', { chainIds })
    const scanned = chainIds.filter(notPylon)
    activeAccount && scanned.length && scanner.addNetworks(activeAccount, chainIds)

    log.verbose('Added networks to Scanner: ', { networks: scanned })
    chainIds.forEach(connected.add.bind(connected))
  }

  const disconnect = (chainIds: number[]) => {
    log.verbose('disconnecting from chains...', { chainIds })

    const scanned = chainIds.filter(notPylon)
    scanned.length && scanner.removeNetworks(scanned)

    chainIds.forEach(connected.delete.bind(connected))
  }

  const has = connected.has.bind(connected)

  const get = () => Array.from(connected)

  return {
    has,
    disconnect,
    update,
    get
  }
}

const externalData = function () {
  const storeApi = BalancesStoreApi(store)
  const balanceProcessor = BalanceProcessor(store, storeApi)
  const scanner = BalanceScanner(store, storeApi, balanceProcessor)
  scanner.start()

  const pylon = new Pylon('wss://data.pylon.link')
  const rates = Rates(pylon, store)

  const inventoryProcessor = InventoryProcessor(store)
  const connectedChains = ConnectedChains(scanner)

  pylonActive = storeApi.getPylonEnabled()
  rates.start()

  if (pylonActive) {
    console.log('PYLON ENABLED... SETTING UP SUBSCRIPTIONS...')
    surface.updateSubscribers(store, balanceProcessor, inventoryProcessor)
  }

  surface.networks.on('updated', (chains: number[]) => {
    log.verbose('Surface networks updated...', { chains })
    connectedChains.update(chains)
  })

  let pauseScanningDelay: NodeJS.Timeout | undefined

  const togglePylon = (currentMode: boolean) => {
    console.log('RUN MODE CHANGED', { newMode: currentMode, usePylon: pylonActive })
    pylonActive = currentMode

    if (!pylonActive) {
      surface.stop()
    } else {
      surface.updateSubscribers(store, balanceProcessor, inventoryProcessor)
    }
    // Switch all surface networks to use the scanner...
    connectedChains.update(surface.networks.get())
  }

  const updateActiveAccount = (currentAccount: string) =>
    debounce(() => {
      if (!currentAccount) return
      rates.updateSubscription(connectedChains.get(), activeAccount)
      console.log('Active account has switched... updating to new account', {
        newActiveAccount: currentAccount
      })
      activeAccount = currentAccount
      scanner.setAddress(currentAccount)
      connectedChains.update(storeApi.getConnectedNetworks().map((network) => network.id))
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

    activeAccount && scanner.addTokens(activeAccount, forScanner)
    //TODO: Map into balances
    const balances: TokenBalance[] = []
    //TODO: use processor to update these balances directly...

    rates.updateSubscription(
      storeApi.getConnectedNetworks().map((network) => network.id),
      activeAccount
    )
  })

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
      removed.length && connectedChains.disconnect(removed)
      added.length && connectedChains.update(added)
      if (added.length || removed.length) rates.updateSubscription(connectedChains.get(), activeAccount)
    }, 800)()

  const observers: Record<string, Observer> = {
    activeAccount: store.observer(() => {
      const currentActive = storeApi.getActiveAddress()
      if (activeUpdated(currentActive)) {
        updateActiveAccount(currentActive)
      }
    }, 'externalData:activeAccount'),
    accounts: store.observer(() => {
      handleAccountChanges()
    }, 'externalData:accounts'),
    tokens: store.observer(() => {
      const customTokens = storeApi.getCustomTokens()
      //TODO: handle known tokens...
      const knownTokens = storeApi.getKnownTokens(activeAccount)
      handleTokensUpdate(customTokens)
    }, 'externalData:tokens'),
    usePylon: store.observer(() => {
      const currentMode = storeApi.getPylonEnabled()

      if (usePylonUpdated(currentMode)) {
        togglePylon(currentMode)
      }
    }, 'externalData:usePylon'),
    networks: store.observer(() => {
      const currentNetworks = storeApi.getConnectedNetworks().map(({ id }) => id)
      log.verbose({ currentNetworks })
      handleNetworkChanges(currentNetworks)
    }, 'externalData:networks'),
    tray: store.observer(() => {
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
  }

  const removeObservers = () => {
    Object.values(observers).forEach((observer) => observer.remove())
  }

  return {
    close: () => {
      removeObservers()
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
