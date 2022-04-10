import log from 'electron-log'

import BalancesWorkerController from './controller'
import { CurrencyBalance, TokenBalance } from './scan'

const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'
const RESTART_WAIT = 5 // seconds

export default function (store: Store) {
  const storeApi = {
    getActiveAddress: () => (store('selected.current') || '') as Address,
    getNetwork: (id: number) => (store('main.networks.ethereum', id) || {}) as Network,
    getConnectedNetworks: () => {
      const networks = (Object.values(store('main.networks.ethereum') || {})) as Network[]
      return networks
        .filter(n => (n.connection.primary || {}).connected || (n.connection.secondary || {}).connected)
    },
    getCustomTokens: () => (store('main.tokens.custom') || []) as Token[],
    getKnownTokens: (address?: Address) => ((address && store('main.tokens.known', address)) || []) as Token[],
    getCurrencyBalances: (address: Address) => {
      return ((store('main.balances', address) || []) as Balance[])
        .filter(balance => balance.address === NATIVE_CURRENCY)
    },
    getTokenBalances: (address: Address) => {
      return ((store('main.balances', address) || []) as Balance[])
        .filter(balance => balance.address !== NATIVE_CURRENCY)
    }
  }

  let scan: NodeJS.Timeout | null
  let workerController: BalancesWorkerController | null

  function attemptRestart () {
    log.warn(`balances controller stopped, restarting in ${RESTART_WAIT} seconds`)
    stop()

    setTimeout(restart, RESTART_WAIT * 1000)
  }

  function handleClose () {
    workerController = null
    attemptRestart()
  }

  function start () {
    log.verbose('starting balances updates')

    workerController = new BalancesWorkerController()
    
    workerController.once('close', handleClose)
    workerController.on('chainBalances', handleChainBalanceUpdate)
    workerController.on('tokenBalances', handleTokenBalanceUpdate)
  }

  function restart () {
    start()

    const activeAddress = storeApi.getActiveAddress()
    if (activeAddress) {
      startScan(activeAddress)
    }
  }

  function stop () {
    log.verbose('stopping balances updates')

    stopScan()

    if (workerController) {
      // if controller is explicitly stopped, don't attempt to restart
      workerController.off('close', handleClose)
      workerController.close()
      workerController = null
    }
  }

  function startScan (address: Address) {
    stopScan()

    log.debug(`starting balances scan for ${address}`)

    const scanForAddress = () => {
      // update balances for the active account every 20 seconds
      setTimeout(() => {
        updateActiveBalances(address)
      }, 0)

      scan = setTimeout(() => scanForAddress(), 20 * 1000)
    }

    if (workerController?.isRunning()) {
      // worker is running, start the scan
      scanForAddress()
    } else {
      log.debug('worker controller not running yet, waiting for ready event')

      // wait for worker to be ready
      workerController?.once('ready', () => scanForAddress())
    }
  }

  function stopScan () {
    log.debug('stopping balances scan')

    if (scan) {
      clearTimeout(scan)
      scan = null
    }
  }

  function updateActiveBalances (address: Address) {
    const activeNetworkIds = storeApi.getConnectedNetworks().map(network => network.id)
    updateBalances(address, activeNetworkIds)
  }

  function updateBalances (address: Address, chains: number[]) {
    const customTokens = storeApi.getCustomTokens()
    const knownTokens = storeApi.getKnownTokens(address).filter(
      token => !customTokens.some(t => t.address === token.address && t.chainId === token.chainId)
    )

    const trackedTokens = [...customTokens, ...knownTokens].filter(t => chains.includes(t.chainId))

    if (trackedTokens.length > 0) {
      workerController?.updateKnownTokenBalances(address, trackedTokens)
    }

    workerController?.updateChainBalances(address, chains)
    workerController?.scanForTokenBalances(address, trackedTokens, chains)
  }

  function handleChainBalanceUpdate (address: Address, balances: CurrencyBalance[]) {
    const currentChainBalances = storeApi.getCurrencyBalances(address)

    balances
      .filter(balance => {
        return (
          // only update positive balances
          parseInt(balance.balance) > 0 &&
          // only update balances if any have changed
          (currentChainBalances.find(b => b.chainId === balance.chainId) || {}).balance !== balance.balance
        )
      })
      .forEach(balance => {
        store.setBalance(address, {
          ...balance,
          symbol: storeApi.getNetwork(balance.chainId).symbol,
          address: NATIVE_CURRENCY
        })
      })
  }

  function handleTokenBalanceUpdate (address: Address, balances: TokenBalance[]) {
    // only update balances if any have changed
    const currentTokenBalances = storeApi.getTokenBalances(address)
    const changedBalances = balances.filter(newBalance => {
      const currentBalance = currentTokenBalances.find(b => b.address === newBalance.address && b.chainId === newBalance.chainId)
      return (!currentBalance || currentBalance.balance !== newBalance.balance)
    })

    if (changedBalances.length > 0) {
      store.setBalances(address, changedBalances)

      const knownTokens = storeApi.getKnownTokens(address)

      // add any non-zero balances to the list of known tokens
      const unknownBalances = changedBalances
        .filter(b => parseInt(b.balance) > 0 && !knownTokens.some(t => t.address === b.address && t.chainId === b.chainId))

      if (unknownBalances.length > 0) {
        store.addKnownTokens(address, unknownBalances)
      }

      // remove zero balances from the list of known tokens
      const zeroBalances = changedBalances
        .filter(b => parseInt(b.balance) === 0 && knownTokens.some(t => t.address === b.address && t.chainId === b.chainId))

      if (zeroBalances.length > 0) {
        store.removeKnownTokens(address, zeroBalances)
      }

    }

    store.accountTokensUpdated(address)
  }

  function setAddress (address: Address) {
    if (!workerController) {
      throw new Error('balances controller not started!')
    }

    if (address) {
      log.verbose('setting address for balances updates', address)
      startScan(address)
    } else {
      log.verbose('clearing address for balances updates')
      stopScan()
    }
  }

  function addNetworks (address: Address, chains: number[]) {
    if (!workerController) {
      throw new Error('balances controller not started!')
    }

    log.verbose('adding balances updates', { address, chains })
    updateBalances(address, chains)
  }

  function addTokens (address: Address, tokens: Token[]) {
    if (!workerController) {
      throw new Error('balances controller not started!')
    }

    log.verbose('adding balances updates', { address, tokens: tokens.map(t => t.address) })
    workerController.updateKnownTokenBalances(address, tokens)
  }

  return { start, stop, setAddress, addNetworks, addTokens }
}
