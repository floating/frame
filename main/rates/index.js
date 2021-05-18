const fetch = require('node-fetch')
const BigNumber = require('bignumber.js')

const FETCH_BATCH_SIZE = 200

// symbol -> coinId
let symbolMapping = {}

function createRate (quote) {
  return {
    usd: {
      price: BigNumber(quote.usd || 0),
      '24hrChange': BigNumber(quote.usd_24h_change || 0)
    }
  }
}

function loadCoins () {
  // try {
  //   const coins = await (await fetch('https://api.coingecko.com/api/v3/coins/list')).json()

  //   allCoins = coins.reduce((coinMapping, coin) => {
  //     coinMapping[coin.symbol.toLowerCase()] = coin.id
  //     return coinMapping
  //   }, {})
  // } catch (e) {
  //   console.error('unable to load coin data', e)
  // }
  symbolMapping = {
    eth: 'ethereum',
    xdai: 'xdai',
    matic: 'matic'
  }
}

async function fetchRates (path, ids, currencies = ['usd']) {
  // have to batch the ids to avoid making the URL too large
  const batches = Object.keys([...Array(Math.ceil(ids.length / FETCH_BATCH_SIZE))])
    .map(batch => ids.slice((batch * FETCH_BATCH_SIZE), (batch * FETCH_BATCH_SIZE) + FETCH_BATCH_SIZE))

  const vsCurrencies = currencies.join(',')

  const responses = await Promise.all(batches.map(batch => {
    const batchIds = batch.join(',')
    const url = `https://api.coingecko.com/api/v3${path}${batchIds}&vs_currencies=${vsCurrencies}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`

    return fetch(url).then(async response => {
      const body = await response.json()

      if (response.status !== 200) throw new Error(JSON.stringify(body))

      return body
    })
  }))

  return Object.assign({}, ...responses)
}

const fetchPrices = async ids => fetchRates('/simple/price?ids=', ids)
const fetchTokenPrices = async addresses => fetchRates('/simple/token_price/ethereum?contract_addresses=', addresses)

async function loadRates (ids) {
  // lookupIds: { symbols: [], contracts: [] }
  const lookupIds = ids.reduce((lookups, id) => {
    // if id is a known symbol, use the CoinGecko id, otherwise it's
    // a contract address and can be looked up directly
    const symbolId = symbolMapping[id]

    if (symbolId) {
      lookups.symbols = { ...lookups.symbols, [symbolId]: id }
    } else {
      lookups.contracts = [...lookups.contracts, id]
    }

    return lookups
  }, { contracts: [] })

  try {
    const symbolQuotes = await fetchPrices(Object.keys(lookupIds.symbols))
    const tokenQuotes = await fetchTokenPrices(lookupIds.contracts)

    return Object.entries({ ...symbolQuotes, ...tokenQuotes }).reduce((rates, [lookupId, quote]) => {
      const originalId = lookupIds.symbols[lookupId] || lookupId // could be symbol or contract address
      rates[originalId] = createRate(quote)

      return rates
    }, {})
  } catch (e) {
    throw new Error(`unable to load latest rates: ${e.message}`)
  }
}

const rates = {
  loadCoins,
  loadRates
}

module.exports = rates
