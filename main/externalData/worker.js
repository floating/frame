const scanTokens = require('./scan')
const rates = require('../rates')
const log = require('electron-log')

log.transports.console.format = '[scanWorker] {h}:{i}:{s} {text}'

let heartbeat

function tokenScan (addresses) {
  addresses.forEach(address => {
    scanTokens(address)
      .then(found => process.send({ type: 'tokens', address, found }))
      .catch(log.error)
  })
}

function ratesScan (symbols) {
  rates.loadRates(symbols)
    .then(loadedRates => process.send({ type: 'rates', rates: loadedRates }))
    .catch(log.error)
}

function resetHeartbeat () {
  clearTimeout(heartbeat)

  heartbeat = setTimeout(() => process.kill(process.pid, 'SIGHUP'), 60 * 1000)
}

const messageHandler = {
  updateCoins: rates.loadCoins,
  updateRates: ratesScan,
  updateTokenBalances: tokenScan
}

process.on('message', message => {
  resetHeartbeat()

  log.debug(`received message: ${message.command} [${message.args}]`)

  const args = message.args || []
  messageHandler[message.command](...args)
})
