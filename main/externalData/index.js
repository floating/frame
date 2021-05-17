const path = require('path')
const log = require('electron-log')
const { fork } = require('child_process')

const store = require('../store')

let activeAddress
let trackedAddresses = []

let scanWorker, heartbeat, allAddressScan, trackedAddressScan, coinScan

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
      store.setBalances(message.address, message.found, message.fullScan)
      updateRates(Object.keys(message.found))
    }

    if (message.type === 'rates') {
      store.setRates(message.rates)
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

const sendHeartbeat = () => sendCommandToWorker('heartbeat')
const updateCoinUniverse = () => sendCommandToWorker('updateCoins')
const updateRates = symbols => sendCommandToWorker('updateRates', [symbols])
const updateTrackedTokens = () => { if (activeAddress) { sendCommandToWorker('updateTokenBalances', [[activeAddress]]) } }
const updateAllTokens = () => sendCommandToWorker('updateTokenBalances', [trackedAddresses])

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
  updateTrackedTokens()
}

function start (addresses = [], omitList = [], knownList) {
  // addAddresses(addresses) // Scan beomces too heavy with many accounts added

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

  if (!trackedAddressScan) {
    // update tokens for the active account every 15 seconds
    trackedAddressScan = startScan(updateTrackedTokens, 1000 * 15)
  }
}

function stop () {
  log.info('stopping external data worker');

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
