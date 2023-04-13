import log from 'electron-log'
import Pylon from '@framelabs/pylon-client'

import store from '../store'
import Inventory from './inventory'
import Rates from './assets'
import { BalancesStoreApi } from './balances'
import { arraysMatch, debounce } from '../../resources/utils'
import BalanceProvider from './balances'

import type { Chain, Token } from '../store/state'

export interface DataScanner {
  close: () => void
}

//TODO: move obserserver into the BalanceProvider // integrate into a single handler...
export default function () {
  const pylon = new Pylon('wss://data.pylon.link')
  // const inventory = Inventory(pylon, store)
  const rates = Rates(pylon, store)
  const storeApi = BalancesStoreApi(store)
  const balances = BalanceProvider(store, storeApi)
  balances.start()

  let connectedChains: number[] = [],
    activeAccount: Address = ''
  let pauseScanningDelay: NodeJS.Timeout | undefined

  setTimeout(() => {
    console.log('SWITCHCHING TO PYLON...')
    store.setBalanceMode('pylon')
  }, 15_000)

  // inventory.start()
  rates.start()

  const handleNetworkUpdate = debounce((newlyConnected: number[]) => {
    log.verbose('updating external data due to network update(s)', { connectedChains, newlyConnected })

    rates.updateSubscription(connectedChains, activeAccount)

    if (newlyConnected.length > 0 && activeAccount) {
      balances.handleNewChains(newlyConnected)
    }
  }, 500)

  const handleAddressUpdate = debounce(() => {
    log.verbose('updating external data due to address update(s)', { activeAccount })

    balances.handleActiveAccountChanged(activeAccount)
    // inventory.setAddresses([activeAccount])
    rates.updateSubscription(connectedChains, activeAccount)
  }, 800)

  const handleTokensUpdate = debounce((tokens: Token[]) => {
    log.verbose('updating external data due to token update(s)', { activeAccount })

    // if (activeAccount) {
    //   balances.addTokens(activeAccount, tokens)
    // }

    rates.updateSubscription(connectedChains, activeAccount)
  })

  const balancesObserver = store.observer(() => {
    //TODO: Handle new accounts here?...
  })

  const allNetworksObserver = store.observer(() => {
    const connectedNetworkIds = storeApi
      .getConnectedNetworks()
      .map((n) => n.id)
      .sort()

    if (!arraysMatch(connectedChains, connectedNetworkIds)) {
      const newlyConnectedNetworks = connectedNetworkIds.filter((c) => !connectedChains.includes(c))
      connectedChains = connectedNetworkIds

      handleNetworkUpdate(newlyConnectedNetworks)
    }
  }, 'externalData:networks')

  const activeAddressObserver = store.observer(() => {
    const activeAddress = storeApi.getActiveAddress()
    const knownTokens = storeApi.getKnownTokens(activeAddress)

    if (activeAddress !== activeAccount) {
      activeAccount = activeAddress
      handleAddressUpdate()
    } else {
      handleTokensUpdate(knownTokens)
    }
  }, 'externalData:activeAccount')

  const customTokensObserver = store.observer(() => {
    const customTokens = storeApi.getCustomTokens()
    handleTokensUpdate(customTokens)
  }, 'externalData:customTokens')

  const trayObserver = store.observer(() => {
    const open = store('tray.open')

    if (!open) {
      // pause balance scanning after the tray is out of view for one minute
      if (!pauseScanningDelay) {
        pauseScanningDelay = setTimeout(() => {
          balances.pauseScanner()
        }, 1000)
      }
    } else {
      if (pauseScanningDelay) {
        clearTimeout(pauseScanningDelay)
        pauseScanningDelay = undefined

        balances.resumeScanner()
      }
    }
  }, 'externalData:tray')

  return {
    close: () => {
      allNetworksObserver.remove()
      activeAddressObserver.remove()
      customTokensObserver.remove()
      balancesObserver.remove()
      balances.stop()

      rates.stop()
      trayObserver.remove()

      if (pauseScanningDelay) {
        clearTimeout(pauseScanningDelay)
      }
    }
  } as DataScanner
}
