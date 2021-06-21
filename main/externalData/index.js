const path = require('path')
const log = require('electron-log')
const { fork } = require('child_process')

const store = require('../store')
const icons = require('./icons')

let activeAddress
let trackedAddresses = []

let currentNetworkObserver, allNetworksObserver
let scanWorker, heartbeat, allAddressScan, trackedAddressScan, coinScan, rateScan, inventoryScan

function createWorker () {
  if (scanWorker) {
    scanWorker.kill()
  }

  scanWorker = fork(path.resolve(__dirname, 'worker.js'))

  scanWorker.on('message', message => {
    if (process.env.LOG_WORKER) {
      log.debug('received message from scan worker: ', message)
    }

    if (message.type === 'ready') updateRates(['eth', 'xdai', 'matic'])

    if (message.type === 'tokens') {
      store.setBalances(message.netId, message.address, message.found, message.fullScan)
      updateRates(Object.keys(message.found))
    }

    if (message.type === 'rates') {
      store.setRates(message.rates)
    }

    if (message.type === 'icons') {
      Object.entries(message.icons)
        .forEach(([symbol, iconUri]) => {
          Object.entries(store('main.networksMeta.ethereum'))
            .filter(([networkId, network]) => network.nativeCurrency.symbol.toLowerCase() === symbol.toLowerCase())
            .forEach(([networkId, network]) => store.setIcon('ethereum', networkId, iconUri))
        })
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
const updateCoinUniverse = () => sendCommandToWorker('updateCoins')
const updateRates = symbols => sendCommandToWorker('updateRates', [symbols])
const updateIcons = symbols => sendCommandToWorker('updateIcons', [symbols])
const updateTrackedTokens = () => { if (activeAddress) { sendCommandToWorker('updateTokenBalances', [[activeAddress]]) } }
const updateAllTokens = () => sendCommandToWorker('updateTokenBalances', [trackedAddresses])

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
  addAddresses([address])
  activeAddress = address

  scanActiveData()
}

function start (addresses = [], omitList = [], knownList) {
  currentNetworkObserver = store.observer(() => {
    const { id } = store('main.currentNetwork')

    log.debug(`changed scanning network to chainId: ${id}`)

    scanActiveData()
  })

  allNetworksObserver = store.observer(() => {
    const networks = store('main.networksMeta.ethereum')

    // update icons for any networks that don't have them
    const needIcons = Object.values(networks)
      .reduce((networkSymbols, network) => {
        if (!network.nativeCurrency.icon && !networkSymbols.includes(network.nativeCurrency.symbol)) {
          return [network.nativeCurrency.symbol, ...networkSymbols]
        }

        return networkSymbols
      }, [])

      console.log({ needIcons })

    updateIcons(needIcons)

  })

  // addAddresses(addresses) // Scan becomes too heavy with many accounts added

  if (scanWorker) {
    log.warn('external data worker already scanning')
    return
  }

  log.info('starting external data scanner')

  scanWorker = createWorker()

  if (!heartbeat) {
    heartbeat = startScan(sendHeartbeat, 1000 * 20)
  }

  if (!coinScan) {
    // update list of known coins/tokens every 10 minutes
    coinScan = startScan(updateCoinUniverse, 1000 * 60 * 10)
  }

  if (!allAddressScan) {
    // update tokens for all accounts (even inactive) every 5 minutes
    allAddressScan = startScan(updateAllTokens, 1000 * 60 * 5)
  }

  if (!rateScan) {
    // update base rates
    const ethereum = store('main.networks.ethereum')
    const baseRates = Object.keys(ethereum).map(n => ethereum[n].symbol && ethereum[n].symbol.toLowerCase()).filter(s => s)
    rateScan = startScan(() => updateRates([...new Set(baseRates)]), 1000 * 15)
  }
}

function stop () {
  log.info('stopping external data worker')

  currentNetworkObserver.remove();
  allNetworksObserver.remove();

  [heartbeat, allAddressScan, trackedAddressScan, coinScan]
    .forEach(scanner => { if (scanner) clearInterval(scanner) })

  heartbeat = null
  allAddressScan = null
  trackedAddressScan = null
  coinScan = null
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
