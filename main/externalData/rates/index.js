const BigNumber = require('bignumber.js')
const log = require('electron-log')

const coingecko = require('../coingecko')

const FETCH_BATCH_SIZE = 200

// { symbol: coinId }
let allCoins = {}

// { contractAddress: platformId }
let tokenPlatforms = {}

function createRate (quote) {
  return {
    usd: {
      price: BigNumber(quote.usd || 0),
      change24hr: BigNumber(quote.usd_24h_change || 0)
    }
  }
}

async function coins () {
  return Object.keys(allCoins).length > 0 ? allCoins : loadCoins()
}

async function loadCoins () {
  try {
    const coins = await coingecko.listCoins()

    for (const coin of coins) {
      allCoins[coin.symbol.toLowerCase()] = coin.id

      for (const platform in (coin.platforms || {})) {
        const contractAddress = coin.platforms[platform]

        if (contractAddress) {
          tokenPlatforms[contractAddress.toLowerCase()] = platform
        }
      }
    }

    return allCoins
  } catch (e) {
    log.error('unable to load coin data', e)
  } finally {
    setTimeout(loadCoins, 60 * 1000)
  }
}

async function fetchRates (fetch, ids, params = []) {
  // have to batch the ids to avoid making the URL too large
  const batches = Object.keys([...Array(Math.ceil(ids.length / FETCH_BATCH_SIZE))])
    .map(batch => ids.slice((batch * FETCH_BATCH_SIZE), (batch * FETCH_BATCH_SIZE) + FETCH_BATCH_SIZE))

  const responses = await Promise.all(batches.map(batch => fetch(batch, ...params)))

  return Object.assign({}, ...responses)
}

const fetchPrices = async ids => fetchRates(coingecko.coinPrices, ids)
const fetchTokenPrices = async (addresses, platform) => fetchRates(coingecko.tokenPrices, addresses, [platform])

async function loadRates (ids) {
  const coinMapping = await coins()

  // lookupIds: { symbols: { [id]: symbol }, contracts: { [platform]: [address, ...] } }
  const lookupIds = ids.reduce((lookups, rawId) => {
    // if id is a known symbol, use the CoinGecko id, otherwise it's
    // a contract address and can be looked up directly
    const id = rawId.toLowerCase()
    const symbolId = coinMapping[id]

    if (symbolId) {
      lookups.symbols = { ...lookups.symbols, [symbolId]: id }
    } else {
      const platform = tokenPlatforms[id]

      if (!platform) {
        log.warn(`could not determine platform for token with address ${id}`)
      } else {
        lookups.contracts[platform] = [...(lookups.contracts[platform] || []), id]
      }
    }

    return lookups
  }, { contracts: [], symbols: {} })

  try {
    const symbolQuotes = await fetchPrices(Object.keys(lookupIds.symbols))

    const tokenQuotes = await Object.entries(lookupIds.contracts).reduce(async (q, [platform, contracts]) => {
      const quotes = await q
      const prices = await fetchTokenPrices(contracts, platform)

      return { ...quotes, ...prices }
    }, {})

    return Object.entries({ ...symbolQuotes, ...tokenQuotes }).reduce((rates, [lookupId, quote]) => {
      const originalId = lookupIds.symbols[lookupId] || lookupId // could be symbol or contract address
      rates[originalId] = createRate(quote)

      return rates
    }, {})
  } catch (e) {
    throw new Error(`unable to load latest rates: ${e.message}`)
  }
}

module.exports = loadRates
