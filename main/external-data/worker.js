const scanTokens = require('./scan')
const rates = require('../rates')
const log = require('electron-log')

log.transports.console.format = '[scanWorker] {h}:{i}:{s} {text}'

let tokenScanner, ratesScanner, coinScanner, heartbeat

function tokenScan (address) {
  scanTokens(address)
    .then(found => process.send({ type: 'tokens', found }))
    .catch(log.error)
}

function ratesScan () {
  rates.loadRates()
    .then(loadedRates => process.send({ type: 'rates', rates: loadedRates }))
    .catch(log.error)
}

function resetHeartbeat () {
  clearTimeout(heartbeat)

  log.debug('received heartbeat')

  heartbeat = setTimeout(() => process.kill(process.pid, 'SIGHUP'), 60 * 1000)
}

const messageHandler = {
  start: function (address) {
    if (!tokenScanner) {
      const scan = tokenScan.bind(null, address)

      scan()
      tokenScanner = setInterval(scan, 1000 * 15)
    }

    if (!coinScanner) {
      rates.loadCoins()
      coinScanner = setInterval(rates.loadCoins, 1000 * 60 * 60)
    }

    if (!ratesScanner) {
      setTimeout(ratesScan, 1000 * 5) // give coins time to load
      ratesScanner = setInterval(ratesScan, 1000 * 30)
    }
  },
  stop: function () {
    [tokenScanner, coinScanner, ratesScanner]
      .forEach(scanner => { if (scanner) clearInterval(scanner) })
  }
}

process.on('message', message => {
  // resetHeartbeat()

  const args = message.args || []
  messageHandler[message.command](...args)
})
