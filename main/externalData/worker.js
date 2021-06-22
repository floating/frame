const scanTokens = require('./scan')
const rates = require('./rates')
const inventory = require('./inventory')
const icons = require('./icons')
const log = require('electron-log')

log.transports.console.format = '[scanWorker] {h}:{i}:{s} {text}'
log.transports.console.level = process.env.LOG_WORKER ? 'debug' : false

let heartbeat

function groupByChainId (tokens) {
  return Object.entries(tokens).reduce((grouped, [symbol, token]) => {
    grouped[token.chainId] = { ...(grouped[token.chainId] || {}), [symbol]: token }
    return grouped
  }, {})
}

function tokenScan (addresses) {
  addresses.forEach(address => {
    scanTokens(address)
      .then(foundTokens => {
        const grouped = groupByChainId(foundTokens)

        Object.entries(grouped).forEach(([netId, found]) => {
          process.send({ type: 'tokens', netId, address, found, fullScan: true })
        })
      })
      .catch(err => log.error('token scan error', err))
  })
}

function ratesScan (symbols) {
  rates(symbols)
    .then(loadedRates => process.send({ type: 'rates', rates: loadedRates }))
    .catch(err => log.error('rates scan error', err))
}

function iconScan (symbols) {
  icons(symbols)
    .then(loadedIcons => process.send({ type: 'icons', icons: loadedIcons }))
    .catch(err => log.error('icon scan error', err))
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
  updateIcons: iconScan,
  updateTokenBalances: tokenScan,
  updateInventory: inventoryScan,
  heartbeat: resetHeartbeat
}

process.on('message', message => {
  log.debug(`received message: ${message.command} [${message.args}]`)

  const args = message.args || []
  messageHandler[message.command](...args)
})

process.send({ type: 'ready' })
