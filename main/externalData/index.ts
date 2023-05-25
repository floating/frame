import log from 'electron-log'
import Pylon from '@framelabs/pylon-client'

import store from '../store'
import RatesSubscriptions from './rates/subscriptions'
import BalanceScanner from './balances/scanner'
import { handleCustomTokenUpdate } from './balances/processor'
import surface from './surface'
import { storeApi } from './balances/storeApi'
import { debounce } from '../../resources/utils'

import {
  createAccountsObserver,
  createActiveAccountObserver,
  createChainsObserver,
  createTokensObserver,
  createTrayObserver
} from './observers'

import type { Token } from '../store/state'

export interface DataScanner {
  close: () => void
}

//TODO: cleanup state now that we are using new observer pattern...
const externalData = function () {
  const scanner = BalanceScanner()
  scanner.start()

  //TODO: move this into the observer creation fn..
  const updateNetworks = () => {
    const chains = storeApi.getConnectedNetworkIds()
    const activeAccount = storeApi.getActiveAddress()
    const usingSurface = surface.networks.get(activeAccount)
    const chainsToScan = chains.filter((chainId) => !usingSurface.includes(chainId))

    log.debug('updateNetworks', { usingSurface, activeAccount, chainsToScan })

    if (activeAccount) {
      scanner.setNetworks(activeAccount, chainsToScan)
    }

    rates.updateSubscription(chains)
  }

  const updateAccount = (account: string) => {
    if (account) {
      scanner.setAddress(account)
    }

    updateNetworks()
  }

  const pylon = new Pylon('wss://data.pylon.link')
  const rates = RatesSubscriptions(pylon)

  rates.start()
  surface.updateSubscribers(Object.keys(store('main.accounts')))

  surface.networks.on('updated', ({ account }) => {
    if (account === storeApi.getActiveAddress()) {
      updateNetworks()
    }
  })

  let pauseScanningDelay: NodeJS.Timeout | undefined

  //TODO: does this need to hit to t
  const handleTokensUpdate = debounce((activeAccount: string, tokens: Token[]) => {
    log.debug('Updating external data due to token updates', { activeAccount })

    handleCustomTokenUpdate(tokens)

    if (activeAccount) {
      const tokensToScan = tokens.filter((token) => !surface.networks.has(activeAccount, token.chainId))
      scanner.addTokens(activeAccount, tokensToScan)
    }

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
    },
    knownTokensChanged() {
      rates.updateSubscription(storeApi.getConnectedNetworks().map((network) => network.id))
    }
  })

  const chainsObserver = createChainsObserver({
    chainsChanged(chains) {
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
