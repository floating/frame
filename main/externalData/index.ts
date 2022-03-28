import path from 'path'
import log from 'electron-log'
import { ChildProcess, fork } from 'child_process'

import Pylon, { AssetType } from '@framelabs/pylon-client'
import store from '../store'
import { CurrencyBalance, TokenBalance } from './balances'
import Inventory from './inventory'
import Rates from './rates'

const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'

let activeAddress: Address
let trackedAddresses: Address[] = []
let connectedChains: number[] = []
let outstandingScans = 0
let activeScanInterval = 30 * 1000 // 30 seconds

let allNetworksObserver: Observer, tokenObserver: Observer, trayObserver: Observer
let scanWorker: ChildProcess | null
let heartbeat: NullableTimeout,
    trackedAddressScan: NullableTimeout,
    scanningReset: NullableTimeout

interface WorkerMessage {
  type: string,
  [key: string]: any
}

interface WorkerError {
  code: string
}

interface CurrencyDataMessage extends Omit<WorkerMessage, 'type'> {
  type: 'nativeCurrencyData',
  currencyData: Record<string, Currency>
}

interface TokenBalanceMessage extends Omit<WorkerMessage, 'type'> {
  type: 'tokenBalances',
  address: Address,
  balances: TokenBalance[],
  source: string
}

interface ChainBalanceMessage extends Omit<WorkerMessage, 'type'> {
  type: 'chainBalances',
  address: Address,
  balances: CurrencyBalance[]
}

const storeApi = {
  getNetwork: (id: number) => (store('main.networks.ethereum', id) || {}) as Network,
  getNetworks: () => (Object.values(store('main.networks.ethereum') || {})) as Network[],
  getNetworkMetadata: (id: number) => store('main.networksMeta.ethereum', id) as NetworkMetadata,
  getNetworksMetadata: () => store('main.networksMeta.ethereum') as NetworkMetadata[],
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

const pylon = new Pylon('wss://data.pylon.link')
const inventory = Inventory(pylon, store)
const rates = Rates(pylon, store)

function setScanning (address: Address) {
  if (scanningReset) {
    clearTimeout(scanningReset)
  }

  scanningReset = setTimeout(() => endScanning(address), 8000)
  outstandingScans = 2

  store.setScanning(address, true)
}

function endScanning (address: Address) {
  if (scanningReset) {
    clearTimeout(scanningReset)
    scanningReset = null
  }

  outstandingScans = 0

  store.setScanning(address, false)
}

function getConnectedNetworks () {
  const networks = storeApi.getNetworks()
  return networks
      .filter(n => (n.connection.primary || {}).connected || (n.connection.secondary || {}).connected)
}

function updateRatesSubscription () {
  const chainIds = getConnectedNetworks().map(n => n.id)
  const knownTokens = storeApi.getKnownTokens(activeAddress)

  subscribeToRates(chainIds, knownTokens)
}

function subscribeToRates (chainIds: number[], tokens: Token[]) {
  const subscribedCurrencies = chainIds.map(chainId => ({ type: AssetType.NativeCurrency, chainId }))
  const subscribedTokens = tokens.map(token => ({ type: AssetType.Token, chainId: token.chainId, address: token.address }))

  rates.setAssets([
    ...subscribedCurrencies,
    ...subscribedTokens
  ])
}

function createWorker () {
  if (scanWorker) {
    scanWorker.kill()
  }

  const workerArgs = process.env.NODE_ENV === 'development' ? ['--inspect=127.0.0.1:9230'] : []

  scanWorker = fork(path.resolve(__dirname, 'worker.js'), workerArgs)

  log.info('created external data worker, pid:', scanWorker.pid)

  scanWorker.on('message', (message: WorkerMessage) => {
    if (process.env.LOG_WORKER) {
      log.debug('received message from scan worker: ', JSON.stringify(message, undefined, 2))
    }

    if (message.type === 'ready') {
      startScanning()
    }

    if (message.type === 'nativeCurrencyData') {
      const { currencyData } = (message as CurrencyDataMessage)
      const networks = storeApi.getNetworks()

      for (const symbol in currencyData) {
        const dataForSymbol = currencyData[symbol]
        const networksForSymbol = networks.filter(network => network.symbol.toLowerCase() === symbol)

        networksForSymbol.forEach(network => {
          store.setNativeCurrencyData('ethereum', network.id, dataForSymbol)
        })
      }
    }

    if (message.type === 'chainBalances') {
      outstandingScans = Math.max(-1, outstandingScans - 1)

      const { address, balances } = (message as ChainBalanceMessage)

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

      if (outstandingScans === 0) {
        endScanning(address)
      }
    }

    if (message.type === 'tokenBalances') {
      const balanceMessage = (message as TokenBalanceMessage)
      const address = balanceMessage.address
      const updatedBalances = balanceMessage.balances || []

      if (balanceMessage.source === 'known') {
        outstandingScans = Math.max(-1, outstandingScans - 1)
      }

      // only update balances if any have changed
      const currentTokenBalances = storeApi.getTokenBalances(address)
      const changedBalances = updatedBalances.filter(newBalance => {
        const currentBalance = currentTokenBalances.find(b => b.address === newBalance.address && b.chainId === newBalance.chainId)
        return (!currentBalance || currentBalance.balance !== newBalance.balance)
      })

      if (changedBalances.length > 0) {
        store.setBalances(address, changedBalances)

        // add any non-zero balances to the list of known tokens
        const nonZeroBalances = changedBalances.filter(b => parseInt(b.balance) > 0)
        store.addKnownTokens(balanceMessage.address, nonZeroBalances)
  
        // remove zero balances from the list of known tokens
        const zeroBalances = changedBalances.filter(b => parseInt(b.balance) === 0)
        store.removeKnownTokens(balanceMessage.address, zeroBalances)

        updateRatesSubscription()
      }

      if (outstandingScans === 0) {
        endScanning(balanceMessage.address)
      }
    }
  })

  scanWorker.on('error', (err: WorkerError) => {
    if (err.code === 'ERR_IPC_CHANNEL_CLOSED') {
      log.error('scan worker IPC channel closed!')

      kill()

      if (heartbeat) {
        log.info('restarting scan worker after IPC channel closed')
        setTimeout(restart, 1000 * 5)
      }
    }

    log.error(new Error(`scan worker error with code: ${err.code}`))
  })

  scanWorker.on('exit', code => {
    log.warn(`scan worker exited with code ${code}`)

    kill()

    if (heartbeat) {
      log.info(`restarting scan worker after exiting with code ${code}`)
      setTimeout(restart, 1000 * 5)
    }
  })

  return scanWorker
}

function sendCommandToWorker (command: string, args: any[] = []) {
  if (!scanWorker) {
    log.error(`attempted to send command ${command} to worker, but worker is not running!`)
    return
  }

  scanWorker.send({ command, args })
}

function startScan (fn: () => void, interval: number | (() => number)) {
  setTimeout(fn, 0)
  return performScan(fn, interval)
}

function performScan (fn: () => void, interval: number | (() => number)) {
  const timeoutInterval = (typeof interval === 'number') ? interval : interval()

  return setTimeout(() => {
    fn()
    performScan(fn, interval)
  }, timeoutInterval)
}

function scanActiveData () {
  if (activeAddress) {
    setScanning(activeAddress)
  }

  if (trackedAddressScan) {
    clearTimeout(trackedAddressScan)
  }

  // update balances for the active account every 30 seconds
  trackedAddressScan = startScan(updateActiveBalances, () => activeScanInterval)
}

const sendHeartbeat = () => sendCommandToWorker('heartbeat')

const updateNativeCurrencyData = (symbols: string[]) => sendCommandToWorker('updateNativeCurrencyData', [symbols])
const updateActiveBalances = () => {
  if (activeAddress) {
    const activeNetworkIds = getConnectedNetworks().map(network => network.id)
    const customTokens = storeApi.getCustomTokens()
    const knownTokens = storeApi.getKnownTokens(activeAddress).filter(
      token => !customTokens.some(t => t.address === token.address && t.chainId === token.chainId)
    )

    const trackedTokens = [...customTokens, ...knownTokens].filter(t => activeNetworkIds.includes(t.chainId))

    sendCommandToWorker('updateChainBalance', [activeAddress])
    sendCommandToWorker('fetchTokenBalances', [activeAddress, trackedTokens])
    sendCommandToWorker('tokenBalanceScan', [activeAddress, trackedTokens])
  }
}

function addAddresses (addresses: Address[]) {
  trackedAddresses = [...trackedAddresses].concat(addresses).reduce((all, addr) => {
    if (addr && !all.includes(addr)) {
      all.push(addr)
    }

    return all
  }, [] as Address[])
}

function setActiveAddress (address: Address) {
  log.verbose(`externalData setActiveAddress(${address})`)

  activeAddress = address
  inventory.setAddresses([activeAddress])

  if (!activeAddress) return

  addAddresses([address])
  updateRatesSubscription()

  if (heartbeat) {
    scanActiveData()
  }
}

function startScanning () {
  allNetworksObserver = store.observer(() => {
    const connectedNetworkIds = getConnectedNetworks().map(n => n.id)

    if (
      connectedNetworkIds.length !== connectedChains.length ||
      connectedNetworkIds.some((chainId, i) => connectedChains[i] !== chainId)
    ) {
      connectedChains = connectedNetworkIds
      
      updateRatesSubscription()

      const networks = getConnectedNetworks()
      const networkCurrencies = [...new Set(networks.map(n => n.symbol.toLowerCase()))]
      updateNativeCurrencyData(networkCurrencies)
      scanActiveData()
    }
  })

  tokenObserver = store.observer(() => {
    const customTokens = storeApi.getCustomTokens()
    if (trackedAddressScan && activeAddress) {
      const activeTokens = customTokens.filter(t => connectedChains.includes(t.chainId))
      sendCommandToWorker('fetchTokenBalances', [activeAddress, activeTokens])
    }
  })

  trayObserver = store.observer(() => {
    const open = store('tray.open')
    activeScanInterval = open ? 30 * 1000 : 3 * 60 * 1000
  }, 'externalData:tray')

  if (!heartbeat) {
    heartbeat = startScan(sendHeartbeat, 1000 * 20)
  }

  scanActiveData()
}

async function start () {
  inventory.start()
  rates.start()

  if (scanWorker) {
    log.warn('external data worker already scanning')
    return
  }

  log.info('starting external data worker')

  scanWorker = createWorker()
}

function stop () {
  log.info('stopping external data worker')

  inventory.stop()
  rates.stop()

  allNetworksObserver.remove()
  tokenObserver.remove()
  trayObserver.remove()

  const scanners = [heartbeat, trackedAddressScan]
  scanners.forEach(scanner => { if (scanner) clearTimeout(scanner) })

  const resets = [scanningReset]
  resets.forEach(reset => { if (reset) clearTimeout(reset) })

  heartbeat = null
  trackedAddressScan = null
  scanningReset = null
}

function restart () {
  stop()
  start()
}

function kill () {
  if (scanWorker) {
    const eventTypes = ['message', 'error', 'exit']

    eventTypes.forEach(evt => scanWorker?.removeAllListeners(evt))

    scanWorker.kill()
    scanWorker = null
  }
}

export default { start, stop, kill, setActiveAddress }
