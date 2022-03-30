import log from 'electron-log'

import BalancesWorkerController, { BalanceSource } from './controller'
import { CurrencyBalance, TokenBalance } from './scan'

const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'

export default function (store: Store) {
  const storeApi = {
    getNetwork: (id: number) => (store('main.networks.ethereum', id) || {}) as Network,
    getConnectedNetworks: () => {
      const networks = (Object.values(store('main.networks.ethereum') || {})) as Network[]
      return networks
        .filter(n => (n.connection.primary || {}).connected || (n.connection.secondary || {}).connected)
    },
    getCustomTokens: () => (store('main.tokens.custom') || []) as Token[],
    getKnownTokens: (address: Address) => (store('main.tokens.known', address) || []) as Token[],
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
    log.warn('balances controller stopped, restarting')
    stop()

    setTimeout(() => {
      start()
    }, 5 * 1000)
  }

  function start () {
    log.verbose('starting balances updates')

    workerController = new BalancesWorkerController()
    
    workerController.once('close', attemptRestart)
    workerController.on('chainBalances', handleChainBalanceUpdate)
    workerController.on('tokenBalances', handleTokenBalanceUpdate)
  }

  function stop () {
    log.verbose('stopping balances updates')

    stopScan()

    if (workerController) {
      // if controller is explicitly stopped, don't attempt to restart
      workerController.off('close', attemptRestart)
      workerController.close()
      workerController = null
    }
  }

  function startScan (address: Address) {
    log.debug(`starting balances scan for ${address}`)

    stopScan()

    const scanForAddress = () => {
      // update balances for the active account every 20 seconds
      setTimeout(() => updateActiveBalances(address), 0)
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
    const customTokens = storeApi.getCustomTokens()
    const knownTokens = storeApi.getKnownTokens(address).filter(
      token => !customTokens.some(t => t.address === token.address && t.chainId === token.chainId)
    )

    const trackedTokens = [...customTokens, ...knownTokens].filter(t => activeNetworkIds.includes(t.chainId))

    workerController?.updateActiveBalances(address, trackedTokens)
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

  function handleTokenBalanceUpdate (address: Address, balances: TokenBalance[], source: BalanceSource) {
    // only update balances if any have changed
    const currentTokenBalances = storeApi.getTokenBalances(address)
    const changedBalances = balances.filter(newBalance => {
      const currentBalance = currentTokenBalances.find(b => b.address === newBalance.address && b.chainId === newBalance.chainId)
      return (!currentBalance || currentBalance.balance !== newBalance.balance)
    })

    if (changedBalances.length > 0) {
      store.setBalances(address, changedBalances)

      // add any non-zero balances to the list of known tokens
      const nonZeroBalances = changedBalances.filter(b => parseInt(b.balance) > 0)
      store.addKnownTokens(address, nonZeroBalances)

      // remove zero balances from the list of known tokens
      const zeroBalances = changedBalances.filter(b => parseInt(b.balance) === 0)
      store.removeKnownTokens(address, zeroBalances)
    }
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

  return { start, stop, setAddress }
}
