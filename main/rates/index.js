const fetch = require('node-fetch')
const BigNumber = require('bignumber.js')

const noData = {
  usd: BigNumber(0)
}

// symbol -> coinId
let allCoins = {}

function createRate (quote) {
  return {
    usd: BigNumber(quote.usd)
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

async function loadRates (symbols) {
  const lookup = symbols.reduce((mapping, symbol) => {
    mapping[allCoins[symbol]] = symbol
    return mapping
  }, {})

  try {
    const quotes = await fetchRates(Object.keys(lookup))

    return Object.entries(quotes).reduce((rates, [id, quote]) => {
      const symbol = lookup[id]
      rates[symbol] = createRate(quote)

      return rates
    }, {})
  } catch (e) {
    console.error('unable to load latest rates', e)
  }
}

const rates = {
  loadCoins,
  loadRates
}

module.exports = rates
