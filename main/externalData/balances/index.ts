import log from 'electron-log'

import { NATIVE_CURRENCY } from '../../../resources/constants'
import BalancesWorkerController from './controller'
import { CurrencyBalance, TokenBalance } from './scan'

const RESTART_WAIT = 5 // seconds

export default function (store: Store) {
  const storeApi = {
    getActiveAddress: () => (store('selected.current') || '') as Address,
    getNetwork: (id: number) => (store('main.networks.ethereum', id) || {}) as Network,
    getNativeCurrencySymbol:(id: number) => store('main.networksMeta.ethereum', id, 'nativeCurrency', 'symbol') as string,
    getConnectedNetworks: () => {
      const networks = (Object.values(store('main.networks.ethereum') || {})) as Network[]
      return networks
        .filter(n => (n.connection.primary || {}).connected || (n.connection.secondary || {}).connected)
    },
    getCustomTokens: () => (store('main.tokens.custom') || []) as Token[],
    getKnownTokens: (address?: Address): Token[] => {
      if(address){
        return (address && store('main.tokens.known', address)) || []
      }
      return Object.values((store('main.tokens.known') as Record<string, Token>)).flat()
    },
    getCurrencyBalances: (address: Address) => {
      return ((store('main.balances', address) || []) as Balance[])
        .filter(balance => balance.address === NATIVE_CURRENCY)
    },
    getTokenBalances: (address: Address) => {
      return ((store('main.balances', address) || []) as Balance[])
        .filter(balance => balance.address !== NATIVE_CURRENCY)
    },
    getBalances: ():Balance[] => Object.values((store('main.balances') as Record<string, Balance>)).flat()
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

  function runWhenReady (fn: () => any) {
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

  function start () {
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

  function restart () {
    start()
    setAddress(storeApi.getActiveAddress())
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

    log.verbose(`starting balances scan for ${address}`)

    const scanForAddress = () => {
      // update balances for the active account every 20 seconds
      setTimeout(() => {
        updateActiveBalances(address)
      }, 0)

      scan = setTimeout(() => {
        if (workerController?.isRunning()) scanForAddress()
      }, 20 * 1000)
    }

    runWhenReady(() => scanForAddress())
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

  function handleUpdate (address: Address, updateFn: (address: Address) => void) {
    // because updates come from another process its possible to receive updates after an account
    // has been removed but before we stop the scan, so check to make sure the account exists
    if (store('main.accounts', address)) {
      updateFn(address)
    }
  }

  function handleChainBalanceUpdate (balances: CurrencyBalance[], address: Address) {
    const currentChainBalances = storeApi.getCurrencyBalances(address)

    // only update balances that have changed
    balances
      .filter(balance => (currentChainBalances.find(b => b.chainId === balance.chainId) || {}).balance !== balance.balance)
      .forEach(balance => {
        store.setBalance(address, {
          ...balance,
          symbol: storeApi.getNativeCurrencySymbol(balance.chainId),
          address: NATIVE_CURRENCY
        })
      })
  }

  function handleTokenBalanceUpdate (balances: TokenBalance[], address: Address) {
    // only update balances if any have changed
    const currentTokenBalances = storeApi.getTokenBalances(address)
    const changedBalances = balances.filter(newBalance => {
      const currentBalance = currentTokenBalances.find(b => b.address === newBalance.address && b.chainId === newBalance.chainId)

      // do not add newly found tokens with a zero balance
      const isNewBalance = !currentBalance && parseInt(newBalance.balance) !== 0
      const isChangedBalance = !!currentBalance && currentBalance.balance !== newBalance.balance

      return isNewBalance || isChangedBalance
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

  function handleTokenBlacklistUpdate (tokens: Token[]) {
    const tokensToRemoveSet = new Set(tokens.map(({address, chainId}) => `${chainId}:${address.toLowerCase()}`))
    const allBalances = storeApi.getBalances()
    const allKnownTokens = storeApi.getKnownTokens()
    const balancesContainsBlacklistedTokens =  allBalances.some(({address, chainId}) => tokensToRemoveSet.has(`${chainId}:${address.toLowerCase()}`))
    const knownTokensContainsBlacklistedTokens = allKnownTokens.some(({address, chainId}) => tokensToRemoveSet.has(`${chainId}:${address.toLowerCase()}`))
    if ( balancesContainsBlacklistedTokens ) store.removeBalances(tokensToRemoveSet)
    if ( knownTokensContainsBlacklistedTokens ) store.removeKnownTokensAllAccounts(tokensToRemoveSet)
  }

  function setAddress (address: Address) {
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

  function addNetworks (address: Address, chains: number[]) {
    if (!workerController) {
      log.warn('tried to add networks but balances controller is not running')
      return
    }

    log.verbose('adding balances updates', { address, chains })
    runWhenReady(() => updateBalances(address, chains))
  }

  function addTokens (address: Address, tokens: Token[]) {
    if (!workerController) {
      log.warn('tried to add tokens but balances controller is not running')
      return
    }

    log.verbose('adding balances updates', { address, tokens: tokens.map(t => t.address) })
    runWhenReady(() => workerController?.updateKnownTokenBalances(address, tokens))
  }

  return { start, stop, setAddress, addNetworks, addTokens }
}
