const fetch = require('node-fetch')
const BigNumber = require('bignumber.js')

const noData = {
  usdRate: BigNumber(0),
  usdDisplayRate: '$0.00'
}

// symbol -> coinId
let allCoins = {}
const coinRates = {}
const watched = []

function createRate (quote) {
  return {
    usdRate: BigNumber(quote.usd),
    usdDisplayRate: new Intl.NumberFormat('us-US', {
      style: 'currency',
      currency: 'usd',
      maximumFractionDigits: 8
    }).format(quote.usd)
  }
}

async function loadCoins () {
  try {
    const coins = await (await fetch('https://api.coingecko.com/api/v3/coins/list')).json()

    allCoins = coins.reduce((coinMapping, coin) => {
      coinMapping[coin.symbol.toLowerCase()] = coin.id
      return coinMapping
    }, {})
  } catch (e) {
    console.error('unable to load coin data', e)
  }
}

async function fetchRates (ids) {
  // have to batch the ids to avoid making the URL too large
  const batches = Object.keys([...Array(Math.ceil(ids.length / 500))])
    .map(batch => ids.slice((batch * 500), (batch * 500) + 500))

  const responses = await Promise.all(batches.map(batch => {
    const batchIds = batch.join(',')
    return fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${batchIds}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`)
      .then(response => response.json())
  }))

  return Object.assign({}, ...responses)
}

async function loadRates (symbols = Object.keys(allCoins)) {
  const lookup = symbols.reduce((mapping, symbol) => {
    const s = symbol.toLowerCase()
    mapping[allCoins[s]] = s
    return mapping
  }, {})

  try {
    const quotes = await fetchRates(Object.keys(lookup))

    Object.entries(quotes).forEach(([id, quote]) => {
      const symbol = lookup[id]
      coinRates[symbol] = createRate(quote)
    })
  } catch (e) {
    console.error('unable to load latest rates', e)
  }
}

loadCoins().then(() => {
  setInterval(loadCoins, 1000 * 60 * 60) // update master coin list once an hour

  loadRates()
  setInterval(() => loadRates(watched), 1000 * 10) // update rates every 10 seconds
})

function get (symbols) {
  const data = symbols.reduce((rates, symbol) => {
    rates[symbol] = coinRates[symbol.toLowerCase()] || noData
    return rates
  }, {})

  return data
}

const rates = {
  get,
  add: function (symbols) {
    // add symbols to watch and return the latest rates
    const newSymbols = symbols.filter(s => !watched.includes(s))
    watched.push(...newSymbols)

    return get(symbols)
  }
}

module.exports = rates
