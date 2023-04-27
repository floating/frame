import log from 'electron-log'
import Pylon from '@framelabs/pylon-client'

import store from '../store'
import Rates from './assets'
import { BalancesStoreApi } from './balances'
import { debounce } from '../../resources/utils'
import BalanceScanner from './balances/scanner'
import processor from './balances/processor'
import surface from './surface'

import type { Token } from '../store/state'
import {
  createAccountsObserver,
  createActiveAccountObserver,
  createChainsObserver,
  createTokensObserver,
  createTrayObserver,
  createUsePylonObserver
} from './observers'

export interface DataScanner {
  close: () => void
}

//TODO: cleanup state now that we are using new observer pattern...
const externalData = function () {
  const storeApi = BalancesStoreApi(store)
  const scanner = BalanceScanner(store, storeApi)
  scanner.start()

  //TODO: move this into the observer creation fn..
  const updateNetworks = () => {
    const chains = storeApi.getConnectedNetworkIds()
    const usingPylon = storeApi.getPylonEnabled()
    const activeAccount = storeApi.getActiveAddress()
    const usingSurface = surface.networks.get(activeAccount)

    const chainsToScan = chains.filter((chainId) => !usingPylon || !usingSurface.includes(chainId))
    log.verbose('updateNetworks', { usingSurface, activeAccount, chainsToScan })
    activeAccount && scanner.setNetworks(activeAccount, chainsToScan)
    rates.updateSubscription(chains)
  }

  const updateAccount = (account: string) => {
    account && scanner.setAddress(account)
    updateNetworks()
  }

  const pylon = new Pylon('wss://data.pylon.link')
  const rates = Rates(pylon, store)

  rates.start()

  if (storeApi.getPylonEnabled()) {
    console.log('PYLON ENABLED... SETTING UP SUBSCRIPTIONS...')
    surface.updateSubscribers(Object.keys(store('main.accounts')))
  }

  surface.networks.on('updated', ({ account }) => {
    log.verbose('Surface networks updated...', { account })
    if (account === storeApi.getActiveAddress()) updateNetworks()
  })

  let pauseScanningDelay: NodeJS.Timeout | undefined

  const togglePylon = (currentMode: boolean) => {
    log.verbose('toggling pylon')
    if (!currentMode) {
      surface.stop()
    } else {
      surface.updateSubscribers(Object.keys(store('main.accounts')))
    }
    // Switch all surface networks to use the scanner...
    updateNetworks()
  }

  //TODO: does this need to hit to t
  const handleTokensUpdate = debounce((activeAccount: string, tokens: Token[]) => {
    const pylonActive = storeApi.getPylonEnabled()
    log.verbose('updating external data due to token update(s)', { activeAccount })

    const forScanner = tokens.filter(
      (token) => !pylonActive || !surface.networks.has(activeAccount, token.chainId)
    )

    pylonActive && processor.handleCustomTokenUpdate(tokens)
    activeAccount && scanner.addTokens(activeAccount, forScanner)
    rates.updateSubscription(storeApi.getConnectedNetworks().map((network) => network.id))
  })

  //TODO: extract observers similar to with the provider observers...

  const activeAccountObserver = createActiveAccountObserver({
    addressChanged(address) {
      updateAccount(address)
    }
  })

  const accountsObserver = createAccountsObserver({
    accountsChanged(accounts) {
      surface.updateSubscribers(accounts)
    }
  })

  const tokensObserver = createTokensObserver({
    customTokensChanged(address, tokens) {
      handleTokensUpdate(address, tokens)
      log.verbose('CUSTOM TOKENS CHANGED...')
    },
    knownTokensChanged() {
      rates.updateSubscription(storeApi.getConnectedNetworks().map((network) => network.id))
      log.verbose('KNOWN TOKENS CHANGED...')
    }
  })

  const usePylonObserver = createUsePylonObserver({
    pylonToggled(enabled) {
      togglePylon(enabled)
    }
  })

  const chainsObserver = createChainsObserver({
    chainsChanged(chains) {
      log.verbose('Networks have changed...', { chains })
      updateNetworks()
    }
  })

  const trayObserver = createTrayObserver({
    trayToggled(open) {
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
    }
  })
  //TODO: do we need to remove these???

  const observers = [
    activeAccountObserver,
    accountsObserver,
    tokensObserver,
    usePylonObserver,
    chainsObserver,
    trayObserver
  ].map((obs) => store.observer(obs))

  const removeObservers = () => {
    observers.forEach((obs) => obs.remove())
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
