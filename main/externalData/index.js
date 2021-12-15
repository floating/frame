const path = require('path')
const log = require('electron-log')
const { fork } = require('child_process')

const store = require('../store')

const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'

let chainId = 0
let activeAddress
let trackedAddresses = []
let networkCurrencies = []

let currentNetworkObserver, allNetworksObserver, tokenObserver
let scanWorker, heartbeat, trackedAddressScan, nativeCurrencyScan, inventoryScan

function createWorker () {
  if (scanWorker) {
    scanWorker.kill()
  }

  scanWorker = fork(path.resolve(__dirname, 'worker.js'))

  scanWorker.on('message', message => {
    if (process.env.LOG_WORKER) {
      log.debug('received message from scan worker: ', JSON.stringify(message, undefined, 2))
    }

    if (message.type === 'ready') {
      startWorker()
    }

    if (message.type === 'chainBalance') {
      const { address, ...balance } = message
      store.setBalance(address, {
        ...balance,
        address: NATIVE_CURRENCY
      })
    }

    if (message.type === 'nativeCurrencyData') {
      for (const symbol in message.currencyData) {
        const currencyData = message.currencyData[symbol]
        const networkIds = Object.entries(store('main.networks.ethereum'))
          .filter(([networkId, network]) => network.symbol.toLowerCase() === symbol)
          .map(([networkId, network]) => networkId)

        networkIds.forEach(networkId => {
          const existingData = store('main.networksMeta.ethereum', networkId, 'nativeCurrency')
          store.setNetworkMeta('ethereum', networkId, { ...existingData, ...currencyData })
        })
      }
    }

    if (message.type === 'tokenBalances') {
      store.setScanning(message.address, false)
      store.setBalances(message.address, message.balances)

      // add any non-zero balances to the list of known tokens
      const nonZeroBalances = message.balances.filter(b => parseInt(b.balance) > 0)
      store.addKnownTokens(message.address, nonZeroBalances)

      // remove zero balances from the list of known tokens
      const zeroBalances = message.balances.filter(b => parseInt(b.balance) === 0)
      store.removeKnownTokens(message.address, zeroBalances)

      const tokenSymbols = message.balances
        .filter(balance => !networkCurrencies.includes(balance.symbol))
        .map(balance => balance.address)

      updateRates(tokenSymbols, message.netId)
    }

    if (message.type === 'rates') {
      store.setRates(message.rates)
    }

    if (message.type === 'icons') {
      const networks = Object.entries(store('main.networksMeta.ethereum'))

      for (const symbol in message.icons) {
        const networksWithSymbol = networks
          .filter(([networkId, network]) => {
            const networkSymbol = network.nativeCurrency.symbol || ''
            return networkSymbol.toLowerCase() === symbol.toLowerCase()
          })

        networksWithSymbol.forEach(([networkId, network]) => {
          store.setIcon('ethereum', networkId, message.icons[symbol])
        })
      }
    }

    if (message.type === 'inventory') {
      store.setInventory(message.address, message.inventory)
    }
  })

  scanWorker.on('error', err => {
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

function sendCommandToWorker (command, args = []) {
  if (!scanWorker) {
    log.error(`attempted to send command ${command} to worker, but worker is not running!`)
    return
  }

  scanWorker.send({ command, args })
}

function startScan (fn, interval) {
  setTimeout(fn, 0)
  return setInterval(fn, interval)
}

function scanNetworkCurrencyRates () {
  if (nativeCurrencyScan) {
    clearInterval(nativeCurrencyScan)
  }

  nativeCurrencyScan = startScan(() => updateNativeCurrencyData(networkCurrencies), 1000 * 15)
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
const updateRates = (symbols, chainId) => sendCommandToWorker('updateRates', [symbols, chainId])
const updateNativeCurrencyData = symbols => sendCommandToWorker('updateNativeCurrencyData', [symbols])
const updateActiveBalances = () => {
  if (activeAddress) {
    const customTokens = store('main.tokens.custom') || []
    const knownTokens = (store('main.tokens.known', activeAddress) || []).filter(
      token => !customTokens.some(t => t.address === token.address && t.chainId === token.chainId)
    )

    const activeSymbol = store('main.networks.ethereum', store('main.currentNetwork.id')).symbol

    sendCommandToWorker('updateChainBalance', [activeAddress, activeSymbol])
    sendCommandToWorker('fetchTokenBalances', [activeAddress, [...customTokens, ...knownTokens]])
    sendCommandToWorker('tokenBalanceScan', [activeAddress])
  }
}

const updateInventory = () => {
  if (activeAddress) { sendCommandToWorker('updateInventory', [[activeAddress]]) }
}


function addAddresses (addresses) {
  trackedAddresses = [...trackedAddresses].concat(addresses).reduce((all, addr) => {
    if (addr && !all.includes(addr)) {
      all.push(addr)
    }

    return all
  }, [])
}

function setActiveAddress (address) {
  log.debug(`externalData setActiveAddress(${address})`)

  addAddresses([address])
  activeAddress = address

  if (heartbeat) {
    scanActiveData()
  }
}

function startWorker () {
  currentNetworkObserver = store.observer(() => {
    const { id } = store('main.currentNetwork')

    if (id !== chainId) {
      log.debug(`changed scanning network to chainId: ${id}`)

      chainId = id
      scanActiveData()
    }
  })

  allNetworksObserver = store.observer(() => {
    const networks = store('main.networks.ethereum')

    const symbols = [...new Set(Object.values(networks).map(n => n.symbol.toLowerCase()))]
    const newSymbolAdded = symbols.some(sym => !networkCurrencies.includes(sym))

    if (!nativeCurrencyScan || newSymbolAdded) {
      networkCurrencies = [...symbols]
      scanNetworkCurrencyRates()
    }
  })

  tokenObserver = store.observer(() => {
    const customTokens = store('main.tokens.custom')
    if (activeAddress && chainId) {
      sendCommandToWorker('fetchTokenBalances', [activeAddress, customTokens])
    }
  })

  if (!heartbeat) {
    heartbeat = startScan(sendHeartbeat, 1000 * 20)
  }
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

  currentNetworkObserver.remove()
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

    eventTypes.forEach(evt => scanWorker.removeAllListeners(evt))

    scanWorker.kill()
    scanWorker = null
  }
}

module.exports = { start, stop, kill, setActiveAddress }
