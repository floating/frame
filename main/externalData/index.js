const path = require('path')
const log = require('electron-log')
const { fork } = require('child_process')

const store = require('../store')

const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'

let chainId = 0
let activeAddress
let trackedAddresses = []

let allNetworksObserver, tokenObserver
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

    if (message.type === 'chainBalances') {
      const { address, balances } = message

      balances
        .filter(balance => parseInt(balance.balance) > 0)
        .forEach(balance => {
          store.setBalance(address, {
            ...balance,
            symbol: (store('main.networks.ethereum', balance.chainId) || {}).symbol,
            address: NATIVE_CURRENCY
          })
        })
    }

    if (message.type === 'tokenBalances') {
      const address = message.address
      const updatedBalances = message.balances || []

      store.setScanning(address, false)

      // only update balances if any have changed
      const currentTokenBalances = (store('main.balances', address) || []).filter(b => b.address !== NATIVE_CURRENCY)
      const changedBalances = updatedBalances.filter(newBalance => {
        const currentBalance = currentTokenBalances.find(b => b.address === newBalance.address && b.chainId === newBalance.chainId)
        return (!currentBalance || currentBalance.balance !== newBalance.balance)
      })

      if (changedBalances.length > 0) {
        store.setBalances(address, changedBalances)
      }

      // add any non-zero balances to the list of known tokens
      const nonZeroBalances = changedBalances.filter(b => parseInt(b.balance) > 0)
      store.addKnownTokens(message.address, nonZeroBalances)

      // remove zero balances from the list of known tokens
      const zeroBalances = changedBalances.filter(b => parseInt(b.balance) === 0)
      store.removeKnownTokens(message.address, zeroBalances)

      const tokenAddresses = updatedBalances.map(balance => balance.address)
      updateRates(tokenAddresses, message.netId)
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

  nativeCurrencyScan = startScan(() => {
    const networks = store('main.networks.ethereum')
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
const updateRates = (symbols, chainId) => sendCommandToWorker('updateRates', [symbols, chainId])
const updateNativeCurrencyData = symbols => sendCommandToWorker('updateNativeCurrencyData', [symbols])
const updateActiveBalances = () => {
  if (activeAddress) {
    const customTokens = store('main.tokens.custom') || []
    const knownTokens = (store('main.tokens.known', activeAddress) || []).filter(
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
  allNetworksObserver = store.observer(() => {
    scanNetworkCurrencyRates()
  })

  tokenObserver = store.observer(() => {
    const customTokens = store('main.tokens.custom')
    if (trackedAddressScan && activeAddress && chainId) {
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

    eventTypes.forEach(evt => scanWorker.removeAllListeners(evt))

    scanWorker.kill()
    scanWorker = null
  }
}

module.exports = { start, stop, kill, setActiveAddress }
