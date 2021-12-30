import path from 'path'
import log from 'electron-log'
import { ChildProcess, fork } from 'child_process'

import store from '../store'
import { groupByChain } from './balances/reducers'
import { CurrencyBalance, TokenBalance } from './balances'

const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'

let activeAddress: Address
let trackedAddresses: Address[] = []

let allNetworksObserver: Observer, tokenObserver: Observer
let scanWorker: ChildProcess | null
let heartbeat: NullableTimeout, trackedAddressScan: NullableTimeout, nativeCurrencyScan: NullableTimeout, inventoryScan: NullableTimeout

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
  balances: TokenBalance[]
}

interface ChainBalanceMessage extends Omit<WorkerMessage, 'type'> {
  type: 'chainBalances',
  address: Address,
  balances: CurrencyBalance[]
}

interface RatesMessage extends Omit<WorkerMessage, 'type'> {
  type: 'rates',
  rates: { [key: string]: Rate }
}

const storeApi = {
  getNetwork: (id: number) => (store('main.networks.ethereum', id) || {}) as Network,
  getNetworks: () => store('main.networks.ethereum') as Network[],
  getNetworkMetadata: (id: number) => store('main.networksMeta.ethereum', id) as NetworkMetadata,
  getNetworksMetadata: () => store('main.networksMeta.ethereum') as NetworkMetadata[],
  getCustomTokens: () => (store('main.tokens.custom') || []) as Token[],
  getKnownTokens: (address: Address) => (store('main.tokens.custom', address) || []) as Token[],
  getTokenBalances: (address: Address) => {
    return ((store('main.balances', address) || []) as Balance[])
      .filter(balance => balance.address !== NATIVE_CURRENCY)
  }
}

function createWorker () {
  if (scanWorker) {
    scanWorker.kill()
  }

  const workerArgs = process.env.NODE_ENV === 'development' ? ['--inspect=127.0.0.1:9230'] : []

  scanWorker = fork(path.resolve(__dirname, 'worker.js'), workerArgs)

  log.debug('created external data worker, pid:', scanWorker.pid)

  scanWorker.on('message', (message: WorkerMessage) => {
    if (process.env.LOG_WORKER) {
      log.debug('received message from scan worker: ', JSON.stringify(message, undefined, 2))
    }

    if (message.type === 'ready') {
      startScanning()
    }

    if (message.type === 'nativeCurrencyData') {
      const { currencyData } = (message as CurrencyDataMessage)

      for (const symbol in currencyData) {
        const dataForSymbol = currencyData[symbol]
        const networkIds = Object.entries(storeApi.getNetworks())
          .filter(([networkId, network]) => network.symbol.toLowerCase() === symbol)
          .map(([networkId, network]) => parseInt(networkId))

        networkIds.forEach(networkId => {
          const existingData = storeApi.getNetworkMetadata(networkId).nativeCurrency
          store.setNativeCurrency('ethereum', networkId, { ...existingData, ...dataForSymbol })
        })
      }
    }

    if (message.type === 'chainBalances') {
      const { address, balances } = (message as ChainBalanceMessage)

      balances
        .filter(balance => parseInt(balance.balance) > 0)
        .forEach(balance => {
          store.setBalance(address, {
            ...balance,
            symbol: storeApi.getNetwork(balance.chainId).symbol,
            address: NATIVE_CURRENCY
          })
        })
    }

    if (message.type === 'tokenBalances') {
      const balanceMessage = (message as TokenBalanceMessage)
      const address = balanceMessage.address
      const updatedBalances = balanceMessage.balances || []

      store.setScanning(address, false)

      // only update balances if any have changed
      const currentTokenBalances = storeApi.getTokenBalances(address)
      const changedBalances = updatedBalances.filter(newBalance => {
        const currentBalance = currentTokenBalances.find(b => b.address === newBalance.address && b.chainId === newBalance.chainId)
        return (!currentBalance || currentBalance.balance !== newBalance.balance)
      })

      if (changedBalances.length > 0) {
        store.setBalances(address, changedBalances)
      }

      // add any non-zero balances to the list of known tokens
      const nonZeroBalances = changedBalances.filter(b => parseInt(b.balance) > 0)
      store.addKnownTokens(balanceMessage.address, nonZeroBalances)

      // remove zero balances from the list of known tokens
      const zeroBalances = changedBalances.filter(b => parseInt(b.balance) === 0)
      store.removeKnownTokens(balanceMessage.address, zeroBalances)

      const tokensByChain = updatedBalances.reduce(groupByChain, {})

      for (const chainId in tokensByChain) {
        updateRates(tokensByChain[chainId].map(t => t.address), parseInt(chainId))
      }
    }

    if (message.type === 'rates') {
      store.setRates((message as RatesMessage).rates)
    }

    if (message.type === 'inventory') {
      store.setInventory(message.address, message.inventory)
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

function startScan (fn: () => void, interval: number) {
  setTimeout(fn, 0)
  return setInterval(fn, interval)
}

function scanNetworkCurrencyRates () {
  if (nativeCurrencyScan) {
    clearInterval(nativeCurrencyScan)
  }

  nativeCurrencyScan = startScan(() => {
    const networks = storeApi.getNetworks()
    const networkCurrencies = [...new Set(Object.values(networks).map(n => n.symbol.toLowerCase()))]

    updateNativeCurrencyData(networkCurrencies)
  }, 1000 * 15)
}

function scanActiveData () {
  if (activeAddress) {
    store.setScanning(activeAddress, true)
  }

  if (trackedAddressScan) {
    clearInterval(trackedAddressScan)
  }

  if (inventoryScan) {
    clearInterval(inventoryScan)
  }

  // update balances for the active account every 15 seconds
  trackedAddressScan = startScan(updateActiveBalances, 1000 * 15)

  // update inventory for the active account every 60 seconds
  inventoryScan = startScan(() => updateInventory(), 1000 * 60)
}

const sendHeartbeat = () => sendCommandToWorker('heartbeat')
const updateRates = (symbols: string[], chainId: number) => sendCommandToWorker('updateRates', [symbols, chainId])
const updateNativeCurrencyData = (symbols: string[]) => sendCommandToWorker('updateNativeCurrencyData', [symbols])
const updateActiveBalances = () => {
  if (activeAddress) {
    const customTokens = storeApi.getCustomTokens()
    const knownTokens = storeApi.getKnownTokens(activeAddress).filter(
      token => !customTokens.some(t => t.address === token.address && t.chainId === token.chainId)
    )

    const trackedTokens = [...customTokens, ...knownTokens]

    sendCommandToWorker('updateChainBalance', [activeAddress])
    sendCommandToWorker('fetchTokenBalances', [activeAddress, trackedTokens])
    sendCommandToWorker('tokenBalanceScan', [activeAddress, trackedTokens])
  }
}

const updateInventory = () => {
  if (activeAddress) { sendCommandToWorker('updateInventory', [[activeAddress]]) }
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
  log.debug(`externalData setActiveAddress(${address})`)

  addAddresses([address])
  activeAddress = address

  if (heartbeat) {
    scanActiveData()
  }
}

function startScanning () {
  allNetworksObserver = store.observer(() => {
    scanNetworkCurrencyRates()
  })

  tokenObserver = store.observer(() => {
    const customTokens = storeApi.getCustomTokens()
    if (trackedAddressScan && activeAddress) {
      sendCommandToWorker('fetchTokenBalances', [activeAddress, customTokens])
    }
  })

  if (!heartbeat) {
    heartbeat = startScan(sendHeartbeat, 1000 * 20)
  }

  scanActiveData()
}

function start () {
  if (scanWorker) {
    log.warn('external data worker already scanning')
    return
  }

  log.info('starting external data scanner')

  scanWorker = createWorker()
}

function stop () {
  log.info('stopping external data worker')

  allNetworksObserver.remove()
  tokenObserver.remove()

  const scanners = [heartbeat, trackedAddressScan, nativeCurrencyScan, inventoryScan]

  scanners.forEach(scanner => { if (scanner) clearInterval(scanner) })

  heartbeat = null
  trackedAddressScan = null
  nativeCurrencyScan = null
  inventoryScan = null
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

module.exports = { start, stop, kill, setActiveAddress }
