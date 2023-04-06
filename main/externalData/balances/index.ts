import log from 'electron-log'

import { NATIVE_CURRENCY } from '../../../resources/constants'
import { toTokenId } from '../../../resources/domain/balance'
import BalancesWorkerController from './controller'
import { CurrencyBalance, TokenBalance } from './scan'

import type { Balance, Chain, Token, WithTokenId } from '../../store/state'

const RESTART_WAIT = 5 // seconds

// time to wait in between scans, in seconds
const scanInterval = {
  active: 20,
  inactive: 60 * 10
}

export default function (store: Store) {
  const storeApi = {
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
    }
  }

  let scan: NodeJS.Timeout | null
  let workerController: BalancesWorkerController | null
  let onResume: Function | null

  function attemptRestart() {
    log.warn(`balances controller stopped, restarting in ${RESTART_WAIT} seconds`)
    stop()

    setTimeout(restart, RESTART_WAIT * 1000)
  }

  function handleClose() {
    workerController = null
    attemptRestart()
  }

  function runWhenReady(fn: () => any) {
    if (workerController?.isRunning()) {
      // worker is running, start the scan
      fn()
    } else {
      log.verbose('worker controller not running yet, waiting for ready event')

      // wait for worker to be ready
      workerController?.once('ready', () => {
        fn()
      })
    }
  }

  function start() {
    log.verbose('starting balances updates')

    workerController = new BalancesWorkerController()

    workerController.once('close', handleClose)
    workerController.on('chainBalances', (address, balances) => {
      handleUpdate(address, handleChainBalanceUpdate.bind(null, balances))
    })

    workerController.on('tokenBalances', (address, balances) => {
      handleUpdate(address, handleTokenBalanceUpdate.bind(null, balances))
    })

    workerController.on('tokenBlacklist', (address, tokens) => {
      handleUpdate(address, handleTokenBlacklistUpdate.bind(null, tokens))
    })
  }

  function restart() {
    start()
    setAddress(storeApi.getActiveAddress())
  }

  function resume() {
    if (onResume) onResume()

    onResume = null
  }

  function pause() {
    if (stopScan()) {
      log.debug('Pausing balances scan')

      const address = storeApi.getActiveAddress()

      if (address) {
        // even when paused ensure data is updated every 10 minutes
        resetScan(address, scanInterval.inactive)

        onResume = () => {
          log.verbose(`Resuming balances scan for address ${address}`)

          startScan(address)
        }
      }
    }
  }

  function stop() {
    log.verbose('stopping balances updates')

    stopScan()

    if (workerController) {
      // if controller is explicitly stopped, don't attempt to restart
      workerController.off('close', handleClose)
      workerController.close()
      workerController = null
    }
  }

  function startScan(address: Address) {
    stopScan()

    if (onResume) onResume = null

    log.verbose(`Starting balances scan for ${address}`)

    const initiateScan = () => {
      // do an initial scan before starting the timer
      setTimeout(() => {
        updateActiveBalances(address)
      }, 0)

      resetScan(address, scanInterval.active)
    }

    runWhenReady(() => initiateScan())
  }

  function stopScan() {
    if (scan) {
      clearTimeout(scan)
      scan = null

      return true
    }

    return false
  }

  function resetScan(address: Address, interval: number) {
    scan = setTimeout(() => {
      if (workerController?.isRunning()) {
        setTimeout(() => {
          updateActiveBalances(address)
        }, 0)
      }

      resetScan(address, interval)
    }, interval * 1000)
  }

  function updateActiveBalances(address: Address) {
    const activeNetworkIds = storeApi.getConnectedNetworks().map((network) => network.id)
    updateBalances(address, activeNetworkIds)
  }

  function updateBalances(address: Address, chains: number[]) {
    const customTokens = storeApi.getCustomTokens()
    const knownTokens = storeApi
      .getKnownTokens(address)
      .filter(
        (token) => !customTokens.some((t) => t.address === token.address && t.chainId === token.chainId)
      )

    const trackedTokens = [...customTokens, ...knownTokens].filter((t) => chains.includes(t.chainId))

    if (trackedTokens.length > 0) {
      workerController?.updateKnownTokenBalances(address, trackedTokens)
    }

    workerController?.updateChainBalances(address, chains)
    workerController?.scanForTokenBalances(address, trackedTokens, chains)
  }

  function handleUpdate(address: Address, updateFn: (address: Address) => void) {
    // because updates come from another process its possible to receive updates after an account
    // has been removed but before we stop the scan, so check to make sure the account exists
    if (store('main.accounts', address)) {
      updateFn(address)
    }
  }

  function handleChainBalanceUpdate(balances: CurrencyBalance[], address: Address) {
    const currentChainBalances = storeApi.getCurrencyBalances(address)

    // only update balances that have changed
    balances
      .filter(
        (balance) =>
          (currentChainBalances.find((b) => b.chainId === balance.chainId) || {}).balance !== balance.balance
      )
      .forEach((balance) => {
        store.setBalance(address, {
          ...balance,
          symbol: storeApi.getNativeCurrencySymbol(balance.chainId),
          address: NATIVE_CURRENCY
        })
      })
  }

  function handleTokenBalanceUpdate(balances: TokenBalance[], address: Address) {
    // only update balances if any have changed
    const currentTokenBalances = storeApi.getTokenBalances(address)
    const customTokens = new Set(storeApi.getCustomTokens().map(toTokenId))
    const isCustomToken = (balance: Balance) => customTokens.has(toTokenId(balance))

    const changedBalances = balances.filter((newBalance) => {
      const currentBalance = currentTokenBalances.find(
        (b) => b.address === newBalance.address && b.chainId === newBalance.chainId
      )

      // do not add newly found tokens with a zero balance
      const isNewBalance = !currentBalance && parseInt(newBalance.balance) !== 0
      const isChangedBalance = !!currentBalance && currentBalance.balance !== newBalance.balance

      return isNewBalance || isChangedBalance || isCustomToken(newBalance)
    })

    if (changedBalances.length > 0) {
      store.setBalances(address, changedBalances)

      const knownTokens = new Set(storeApi.getKnownTokens(address).map(toTokenId))
      const isKnown = (balance: TokenBalance) => knownTokens.has(toTokenId(balance))

      // add any non-zero balances to the list of known tokens
      const unknownBalances = changedBalances.filter((b) => parseInt(b.balance) > 0 && !isKnown(b))

      if (unknownBalances.length > 0) {
        store.addKnownTokens(address, unknownBalances)
      }

      // remove zero balances from the list of known tokens
      const zeroBalances = changedBalances.reduce((zeroBalSet, balance) => {
        const tokenId = toTokenId(balance)
        if (parseInt(balance.balance) === 0 && knownTokens.has(tokenId)) {
          zeroBalSet.add(tokenId)
        }
        return zeroBalSet
      }, new Set<string>())

      if (zeroBalances.size) {
        store.removeKnownTokens(address, zeroBalances)
      }
    }

    store.accountTokensUpdated(address)
  }

  function handleTokenBlacklistUpdate(tokensToRemove: Set<string>) {
    const includesBlacklistedTokens = (arr: WithTokenId[]) =>
      arr.some((val) => tokensToRemove.has(toTokenId(val)))

    const balances: Record<string, Balance[]> = store('main.balances')
    const knownTokens: Record<string, Token[]> = store('main.tokens.known')

    Object.entries(balances).forEach(([accountAddress, balances]) => {
      if (includesBlacklistedTokens(balances)) {
        store.removeBalances(accountAddress, tokensToRemove)
      }
    })

    Object.entries(knownTokens).forEach(([accountAddress, tokens]) => {
      if (includesBlacklistedTokens(tokens)) {
        store.removeKnownTokens(accountAddress, tokensToRemove)
      }
    })
  }

  function setAddress(address: Address) {
    if (!workerController) {
      log.warn(`tried to set address to ${address} but balances controller is not running`)
      return
    }

    if (address) {
      log.verbose('setting address for balances updates', address)
      startScan(address)
    } else {
      log.verbose('clearing address for balances updates')
      stopScan()
    }
  }

  function addNetworks(address: Address, chains: number[]) {
    if (!workerController) {
      log.warn('tried to add networks but balances controller is not running')
      return
    }

    log.verbose('adding balances updates', { address, chains })
    runWhenReady(() => updateBalances(address, chains))
  }

  function addTokens(address: Address, tokens: Token[]) {
    if (!workerController) {
      log.warn('tried to add tokens but balances controller is not running')
      return
    }

    log.verbose('adding balances updates', { address, tokens: tokens.map((t) => t.address) })
    runWhenReady(() => workerController?.updateKnownTokenBalances(address, tokens))
  }

  return { start, stop, resume, pause, setAddress, addNetworks, addTokens }
}
