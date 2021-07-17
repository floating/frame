const path = require('path')
const log = require('electron-log')
const { fork } = require('child_process')

const store = require('../store')

let activeAddress
let trackedAddresses = []
let networkCurrencies = []

let currentNetworkObserver, allNetworksObserver
let scanWorker, heartbeat, allAddressScan, trackedAddressScan, nativeCurrencyScan, inventoryScan

function createWorker () {
  if (scanWorker) {
    scanWorker.kill()
  }

  scanWorker = fork(path.resolve(__dirname, 'worker.js'))

  scanWorker.on('message', message => {
    if (process.env.LOG_WORKER) {
      log.debug('received message from scan worker: ', JSON.stringify(message, undefined, 2))
    }

    if (message.type === 'chainBalance') {
      store.setBalance(message.chainId, message.address, 'native', message.balance)
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
      store.setBalances(message.netId, message.address, message.balances, message.fullScan)

      const tokenSymbols = Object.keys(message.balances).filter(sym => !networkCurrencies.includes(sym.toLowerCase()))

      if (tokenSymbols.length > 0) {
        updateRates(tokenSymbols, message.netId)
      }
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
      console.error('scan worker IPC channel closed! restarting worker')

      kill()
      setTimeout(restart, 1000 * 5)
    }

    log.error(new Error(`scan worker error with code: ${err.code}`))
  })

  scanWorker.on('exit', code => {
    log.warn(`scan worker exited with code ${code}, restarting worker`)

    kill()
    setTimeout(restart, 1000 * 5)
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
const updateAllTokens = () => sendCommandToWorker('updateTokenBalances', [trackedAddresses])
const updateActiveBalances = () => {
  if (activeAddress) {
    sendCommandToWorker('updateChainBalance', [activeAddress])
    sendCommandToWorker('updateTokenBalances', [[activeAddress]])
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
  log.debug(`setActiveAddress(${address})`)

  addAddresses([address])
  activeAddress = address

  scanActiveData()
}

function start (addresses = [], omitList = [], knownList) {
  if (scanWorker) {
    log.warn('external data worker already scanning')
    return
  }

  log.info('starting external data scanner')

  scanWorker = createWorker()

  currentNetworkObserver = store.observer(() => {
    const { id } = store('main.currentNetwork')

    log.debug(`changed scanning network to chainId: ${id}`)

    scanActiveData()
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

  if (!heartbeat) {
    heartbeat = startScan(sendHeartbeat, 1000 * 20)
  }

  if (!allAddressScan) {
    // update tokens for all accounts (even inactive) every 5 minutes
    allAddressScan = startScan(updateAllTokens, 1000 * 60 * 5)
  }
}

function stop () {
  log.info('stopping external data worker')

  currentNetworkObserver.remove()
  allNetworksObserver.remove()

  const scanners = [heartbeat, allAddressScan, trackedAddressScan, nativeCurrencyScan, inventoryScan]

  scanners.forEach(scanner => { if (scanner) clearInterval(scanner) })

  heartbeat = null
  allAddressScan = null
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
    scanWorker.kill()
    scanWorker = null
  }
}

module.exports = { start, stop, kill, setActiveAddress }
