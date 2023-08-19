import deepEqual from 'deep-equal'

import { arraysEqual } from '../../../resources/utils'
import { storeApi } from '../storeApi'

import type { Token } from '../../store/state/types'

interface ActiveAddressChangedHandler {
  addressChanged: (address: Address) => void
}

interface AccountsChangedHandler {
  accountsChanged: (addresses: Address[]) => void
}

interface TokensChangedHandler {
  customTokensChanged: (address: Address, tokens: Token[]) => void
  knownTokensChanged: (address: Address, tokens: Token[]) => void
}

interface TrayChangedHandler {
  trayToggled: (open: boolean) => void
}

interface ChainIdsChangedHandler {
  chainsChanged: (chains: number[]) => void
}

function createChainsObserver(handler: ChainIdsChangedHandler) {
  let availableChains = storeApi.getConnectedNetworkIds()

  return function () {
    const currentChains = storeApi.getConnectedNetworkIds()

    if (!arraysEqual(currentChains, availableChains)) {
      const toAdd = currentChains.filter((c) => !availableChains.includes(c))
      const toRemove = availableChains.filter((c) => !currentChains.includes(c))
      availableChains = currentChains

      if (toAdd.length || toRemove.length) {
        setTimeout(() => {
          handler.chainsChanged(currentChains)
        }, 0)
      }
    }
  }
}

function createActiveAccountObserver(handler: ActiveAddressChangedHandler) {
  let activeAccount = storeApi.getActiveAddress()

  return function () {
    const currentActiveAccount = storeApi.getActiveAddress()

    if (currentActiveAccount !== activeAccount) {
      activeAccount = currentActiveAccount
      setTimeout(() => {
        handler.addressChanged(activeAccount)
      }, 0)
    }
  }
}

//TODO: do we need to sort the arrays?
function createTokensObserver(handler: TokensChangedHandler) {
  let customTokens = storeApi.getCustomTokens()
  let knownTokens = storeApi.getKnownTokens()

  return function () {
    const currentAccount = storeApi.getActiveAddress()
    const currentCustomTokens = storeApi.getCustomTokens()
    const currentKnownTokens = storeApi.getKnownTokens(currentAccount)

    if (!deepEqual(currentCustomTokens, customTokens)) {
      customTokens = currentCustomTokens

      setTimeout(() => {
        handler.customTokensChanged(currentAccount, customTokens)
      }, 0)
    }

    if (!deepEqual(currentKnownTokens, knownTokens)) {
      knownTokens = currentKnownTokens

      setTimeout(() => {
        handler.knownTokensChanged(currentAccount, knownTokens)
      }, 0)
    }
  }
}

function createTrayObserver(handler: TrayChangedHandler) {
  let trayOpen = storeApi.getTrayOpened()

  return function () {
    const currentTrayOpen = storeApi.getTrayOpened()

    if (currentTrayOpen !== trayOpen) {
      trayOpen = currentTrayOpen
      setTimeout(() => {
        handler.trayToggled(trayOpen)
      }, 0)
    }
  }
}

function createAccountsObserver(handler: AccountsChangedHandler) {
  let accounts = storeApi.getAccounts()

  return function () {
    const currentAccounts = storeApi.getAccounts()

    if (!arraysEqual(currentAccounts, accounts)) {
      accounts = currentAccounts
      setTimeout(() => {
        handler.accountsChanged(accounts)
      }, 0)
    }
  }
}

export {
  createAccountsObserver,
  createActiveAccountObserver,
  createChainsObserver,
  createTokensObserver,
  createTrayObserver
}
