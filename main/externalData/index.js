const path = require('path')
const log = require('electron-log')
const { fork } = require('child_process')

const store = require('../store')

let activeAddress
let trackedAddresses = []
let networkCurrencies = []

let currentNetworkObserver, allNetworksObserver
let scanWorker, heartbeat, allAddressScan, trackedAddressScan, baseRateScan, inventoryScan

function createWorker () {
  if (scanWorker) {
    scanWorker.kill()
  }

  scanWorker = fork(path.resolve(__dirname, 'worker.js'))

  scanWorker.on('message', message => {
    if (process.env.LOG_WORKER) {
      log.debug('received message from scan worker: ', message)
    }

    if (message.type === 'coinBalance') {
      const symbol = store('main.networks.ethereum', message.netId).symbol.toLowerCase()
      const balance = {
        chainId: message.netId,
        symbol,
        balance: message.coinBalance
      }

      store.setBalance(message.netId, message.address, symbol, balance)
    }

    if (message.type === 'tokens') {
      store.setBalances(message.netId, message.address, message.found, message.fullScan)

      const tokenSymbols = Object.keys(message.found).filter(sym => !networkCurrencies.includes(sym.toLowerCase()))

      if (tokenSymbols.length > 0) {
        updateRates(tokenSymbols)
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
  if (baseRateScan) {
    clearInterval(baseRateScan)
  }

  baseRateScan = startScan(() => updateRates(networkCurrencies), 1000 * 15)
}

function scanActiveData () {
  if (trackedAddressScan) {
    clearInterval(trackedAddressScan)
  }

  if (inventoryScan) {
    clearInterval(inventoryScan)
  }

  // update tokens for the active account every 15 seconds
  trackedAddressScan = startScan(updateTrackedTokens, 1000 * 15)

  // update inventory for the active account every 60 seconds
  inventoryScan = startScan(() => updateInventory(), 1000 * 60)
}

const sendHeartbeat = () => sendCommandToWorker('heartbeat')
const updateRates = symbols => sendCommandToWorker('updateRates', [symbols])
const updateIcons = symbols => sendCommandToWorker('updateIcons', [symbols])
const updateTrackedTokens = () => { if (activeAddress) { sendCommandToWorker('updateTokenBalances', [[activeAddress]]) } }
const updateAllTokens = () => sendCommandToWorker('updateTokenBalances', [trackedAddresses])

const updateInventory = () => {
  if (activeAddress) { sendCommandToWorker('updateInventory', [[activeAddress]]) }
}

const networksWithoutIcons = (networkSymbols, network) => {
  const symbol = network.nativeCurrency.symbol

  if (network.nativeCurrency.icon || networkSymbols.includes(symbol)) {
    return networkSymbols
  }

  return [symbol, ...networkSymbols]
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
    const networkMeta = store('main.networksMeta.ethereum')

    const symbols = [...new Set(Object.values(networks).map(n => n.symbol.toLowerCase()))]

    // update icons for any networks that don't have them
    const needIcons = Object.values(networkMeta).reduce(networksWithoutIcons, [])

    if (symbols.some(sym => !networkCurrencies.includes(sym))) {
      networkCurrencies = [...symbols]
      scanNetworkCurrencyRates()
    }

    if (needIcons.length > 0) {
      updateIcons(needIcons)
    }
  })

  // addAddresses(addresses) // Scan becomes too heavy with many accounts added

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
  allNetworksObserver.remove();

  [heartbeat, allAddressScan, trackedAddressScan, baseRateScan, inventoryScan]
    .forEach(scanner => { if (scanner) clearInterval(scanner) })

  heartbeat = null
  allAddressScan = null
  trackedAddressScan = null
  baseRateScan = null
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
