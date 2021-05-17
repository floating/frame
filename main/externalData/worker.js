const scanTokens = require('./scan')
const rates = require('../rates')
const log = require('electron-log')

log.transports.console.format = '[scanWorker] {h}:{i}:{s} {text}'
log.transports.console.level = process.env.LOG_WORKER ? 'debug' : false

let heartbeat

function tokenScan (addresses) {
  addresses.forEach(address => {
    scanTokens(address)
      .then(found => process.send({ type: 'tokens', address, found, fullScan: true }))
      .catch(err => log.error('token scan error', err))
  })
}

function ratesScan (symbols) {
  rates.loadRates(symbols)
    .then(loadedRates => process.send({ type: 'rates', rates: loadedRates }))
    .catch(err => log.error('rates scan error', err))
}

function resetHeartbeat () {
  clearTimeout(heartbeat)

  heartbeat = setTimeout(() => {
    log.warn('no heartbeat received in 60 seconds, worker exiting')
    process.kill(process.pid, 'SIGHUP')
  }, 60 * 1000)
}

const messageHandler = {
  updateCoins: rates.loadCoins,
  updateRates: ratesScan,
  updateTokenBalances: tokenScan,
  heartbeat: resetHeartbeat
}

process.on('message', message => {
  log.debug(`received message: ${message.command} [${message.args}]`)

  const args = message.args || []
  messageHandler[message.command](...args)
})

process.send({ type: 'ready' })
