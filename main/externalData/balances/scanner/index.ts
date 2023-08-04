import log from 'electron-log'
import { storeApi } from '../../storeApi'
import { NATIVE_CURRENCY } from '../../../../resources/constants'
import { toTokenId } from '../../../../resources/domain/balance'
import BalancesWorkerController from '../controller'
import { handleBalanceUpdate } from '../processor'
import { CurrencyBalance } from '../scan'
import { Token, TokenBalance, WithTokenId } from '../../../store/state'

const RESTART_WAIT = 5 // seconds

// time to wait in between scans, in seconds
const scanInterval = {
  active: 20,
  inactive: 60 * 10
}

function BalanceScanner() {
  let scan: NodeJS.Timeout | null
  let workerController: BalancesWorkerController | null
  let onResume: (() => void) | null
  let enabledNetworks = new Set<number>()
  const isOnEnabledChain = (balance: TokenBalance) => enabledNetworks.has(balance.chainId)
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
    const networks = Array.from(enabledNetworks)

    if (networks.length > 0) {
      log.verbose('Updating active balances', { networks, address })
      updateBalances(address, networks)
    }
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
    const accounts = storeApi.getAccounts()
    if (accounts.includes(address)) updateFn(address)
  }

  function handleChainBalanceUpdate(balances: CurrencyBalance[], address: Address) {
    for (const balance of balances) {
      const nativeCurrency = storeApi.getNativeCurrency(balance.chainId)
      if (nativeCurrency) {
        const { symbol, decimals, name, media, hideByDefault } = nativeCurrency
        storeApi.setBalance(address, {
          ...balance,
          symbol,
          decimals,
          name,
          address: NATIVE_CURRENCY,
          media,
          hideByDefault
        })
      }
    }

    if (balances.length > 0) {
      storeApi.setAccountTokensUpdated(address)
    }
  }

  function handleTokenBalanceUpdate(balances: TokenBalance[], address: Address) {
    const filtered = balances.filter(isOnEnabledChain)
    handleBalanceUpdate(address, filtered, Array.from(enabledNetworks), 'scan')
  }

  function handleTokenBlacklistUpdate(tokensToRemove: Set<string>) {
    const includesBlacklistedTokens = (arr: WithTokenId[]) =>
      arr.some((val) => tokensToRemove.has(toTokenId(val)))

    const balances = storeApi.getAllBalances()
    const knownTokens = storeApi.getAllKnownTokens()

    Object.entries(balances).forEach(([accountAddress, balances]) => {
      if (includesBlacklistedTokens(balances)) {
        storeApi.removeBalances(accountAddress, tokensToRemove)
      }
    })

    Object.entries(knownTokens).forEach(([accountAddress, tokens]) => {
      if (includesBlacklistedTokens(tokens)) {
        storeApi.removeKnownTokens(accountAddress, tokensToRemove)
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

  function setNetworks(address: string, chains: number[]) {
    if (chains.length !== enabledNetworks.size || chains.some((chainId) => !enabledNetworks.has(chainId))) {
      enabledNetworks = new Set(chains)
      runWhenReady(() => updateBalances(address, chains))
    }
  }

  function addTokens(address: Address, tokens: Token[]) {
    if (!workerController) {
      log.warn('tried to add tokens but balances controller is not running')
      return
    }

    log.verbose('adding balances updates', { address, tokens: tokens.map((t) => t.address) })
    runWhenReady(() => workerController?.updateKnownTokenBalances(address, tokens))
  }

  return { start, stop, resume, pause, setAddress, addTokens, setNetworks }
}

export default BalanceScanner
