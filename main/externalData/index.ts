import log from 'electron-log'
import Pylon from '@framelabs/pylon-client'

import store from '../store'
import Rates from './assets'
import { BalancesStoreApi } from './balances'
import { debounce } from '../../resources/utils'
import BalanceScanner from './balances/scanner'
import balanceProcessor from './balances/processor'
import surface from './surface'

import type { TokenBalance } from './balances/scan'

let pylonActive = false
let activeAccount = ''
const activeChains = new Set<number>()

const activeUpdated = (current: string) => current !== activeAccount
const usePylonUpdated = (newMode: boolean) => newMode !== pylonActive

import type { Token } from '../store/state'

export interface DataScanner {
  close: () => void
}

const externalData = function () {
  const storeApi = BalancesStoreApi(store)
  const scanner = BalanceScanner(store, storeApi)
  scanner.start()

  const updateNetworks = () => {
    const connnected = Array.from(activeChains)
    const usingSurface = surface.networks.get(activeAccount)

    const chainsToScan = connnected.filter((chainId) => !pylonActive || !usingSurface.includes(chainId))
    scanner.setNetworks(chainsToScan)
  }

  const updateAccount = () => {
    activeAccount && scanner.setAddress(activeAccount)
  }

  const pylon = new Pylon('wss://data.pylon.link')
  const rates = Rates(pylon, store)

  pylonActive = storeApi.getPylonEnabled()
  rates.start()

  if (pylonActive) {
    console.log('PYLON ENABLED... SETTING UP SUBSCRIPTIONS...')
    surface.updateSubscribers(Object.keys(store('main.accounts')))
  }

  surface.networks.on('updated', ({ account, chains }) => {
    log.verbose('Surface networks updated...', { chains })
    updateNetworks()
  })

  let pauseScanningDelay: NodeJS.Timeout | undefined

  const togglePylon = (currentMode: boolean) => {
    console.log('RUN MODE CHANGED', { newMode: currentMode, usePylon: pylonActive })
    pylonActive = currentMode

    if (!pylonActive) {
      surface.stop()
    } else {
      surface.updateSubscribers(Object.keys(store('main.accounts')))
    }
    // Switch all surface networks to use the scanner...
    updateNetworks()
  }

  const updateActiveAccount = (currentAccount: string) =>
    debounce(() => {
      if (!currentAccount) return
      const connected = storeApi.getConnectedNetworkIds()
      rates.updateSubscription(connected, activeAccount)
      console.log('Active account has switched... updating to new account', {
        newActiveAccount: currentAccount
      })
      activeAccount = currentAccount
      updateNetworks()
      updateAccount()
    }, 800)()

  const handleTokensUpdate = debounce((tokens: Token[]) => {
    log.verbose('updating external data due to token update(s)', { activeAccount })

    const [forProcessor, forScanner] = tokens.reduce(
      ([forProcessor, forScanner], token) => {
        return pylonActive && surface.networks.has(activeAccount, token.chainId)
          ? [
              forProcessor.concat({
                ...token,
                balance: '0x00',
                displayBalance: '0'
              }),
              forScanner
            ]
          : [forProcessor, forScanner.concat(token)]
      },
      [[] as TokenBalance[], [] as Token[]]
    )

    activeAccount && scanner.addTokens(activeAccount, forScanner)
    rates.updateSubscription(
      storeApi.getConnectedNetworks().map((network) => network.id),
      activeAccount
    )
  })

  const handleNetworkChanges = (networks: number[]) =>
    debounce(() => {
      console.log('handling network changes...', {
        networks,
        activeAccount
      })
      const set = new Set(networks)
      const added = networks.filter((id) => !activeChains.has(id))
      const removed = Array.from(activeChains).filter((id) => !set.has(id))
      if (added.length || removed.length) {
        log.verbose('Networks have changed...', { added, removed })
        removed.forEach(activeChains.delete.bind(activeChains))
        added.forEach(activeChains.add.bind(activeChains))
        updateNetworks()
        rates.updateSubscription(Array.from(activeChains), activeAccount)
      }
    }, 800)()

  const observers: Record<string, Observer> = {
    activeAccount: store.observer(() => {
      const currentActive = storeApi.getActiveAddress()
      if (activeUpdated(currentActive)) {
        updateActiveAccount(currentActive)
      }
    }, 'externalData:activeAccount'),
    accounts: store.observer(() => {
      if (!pylonActive) return
      const accounts = Object.keys(store('main.accounts'))
      if (accounts.length) {
        surface.updateSubscribers(accounts)
      }
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
