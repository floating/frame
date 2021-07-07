const log = require('electron-log')

const balances = require('./balances')
const rates = require('./rates')
const inventory = require('./inventory')
const loadStaticData = require('./staticData')

log.transports.console.format = '[scanWorker] {h}:{i}:{s} {text}'
log.transports.console.level = process.env.LOG_WORKER ? 'debug' : false

let heartbeat

function tokenBalanceScan (addresses) {
  addresses.forEach(address => {
    balances.getTokenBalances(address)
      .then(foundTokens => {
        process.send({ type: 'tokenBalances', netId: foundTokens.networkId, address, balances: foundTokens.balances, fullScan: true })
      })
      .catch(err => log.error('token scan error', err))
  })
}

function chainBalanceScan (address) {
  balances.getNativeCurrencyBalance(address)
    .then(balance => process.send({ type: 'chainBalance', ...balance }))
    .catch(err => log.error('chain balance scan error', err))
}

function ratesScan (symbols, chainId) {
  rates(symbols, chainId)
    .then(loadedRates => process.send({ type: 'rates', rates: loadedRates }))
    .catch(err => log.error('rates scan error', err))
}

function nativeCurrencyScan (symbols) {
  loadStaticData(symbols)
    .then(currencyData => process.send({ type: 'nativeCurrencyData', currencyData }))
    .catch(err => log.error('native currency scan error', err))
}

function inventoryScan (addresses) {
  addresses.forEach(address => {
    inventory(address)
      .then(inventory => process.send({ type: 'inventory', address, inventory }))
      .catch(err => log.error('inventory scan error', err))
  })
}

function resetHeartbeat () {
  clearTimeout(heartbeat)

  heartbeat = setTimeout(() => {
    log.warn('no heartbeat received in 60 seconds, worker exiting')
    process.kill(process.pid, 'SIGHUP')
  }, 60 * 1000)
}

const messageHandler = {
  updateRates: ratesScan,
  updateNativeCurrencyData: nativeCurrencyScan,
  updateChainBalance: chainBalanceScan,
  updateTokenBalances: tokenBalanceScan,
  updateInventory: inventoryScan,
  heartbeat: resetHeartbeat
}

process.on('message', message => {
  log.debug(`received message: ${message.command} [${message.args}]`)

  const args = message.args || []
  messageHandler[message.command](...args)
})

process.send({ type: 'ready' })
