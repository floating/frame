const scanTokens = require('./scan')
const rates = require('../rates')

function log (msg, level = 'info') {
  process.send({ type: 'log', level, msg })
}

function tokenScan (address) {
  scanTokens(address)
    .then(found => process.send({ type: 'tokens', found }))
    .catch(err => log(err, 'error'))
}

function ratesScan () {
  rates.loadRates()
    .then(loadedRates => process.send({ type: 'rates', rates: loadedRates }))
    .catch(err => log(err, 'error'))
}

let tokenScanner, ratesScanner, coinScanner

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

process.on('message', message => messageHandler[message.command](...message.args))
