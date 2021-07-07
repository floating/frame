const BigNumber = require('bignumber.js')
const log = require('electron-log')

const coingecko = require('../coingecko')

const FETCH_BATCH_SIZE = 200

// { symbol: coinId }
let allCoins

// { chainId: platformId }
let allPlatforms

function createRate (quote) {
  return {
    usd: {
      price: BigNumber(quote.usd || 0),
      change24hr: BigNumber(quote.usd_24h_change || 0)
    }
  }
}

async function coins () {
  return allCoins || loadCoins()
}

async function assetPlatforms () {
  return allPlatforms || loadPlatforms()
}

async function loadCoins () {
  try {
    const coins = await coingecko.listCoins()

    allCoins = coins.reduce((coinMapping, coin) => {
      coinMapping[coin.symbol.toLowerCase()] = coin.id
      return coinMapping
    }, {})

    return allCoins
  } catch (e) {
    log.error('unable to load coin data', e)
  } finally {
    setTimeout(loadCoins, 60 * 1000)
  }
}

async function loadPlatforms () {
  try {
    const platforms = await coingecko.assetPlatforms()

    allPlatforms = platforms.reduce((platformMapping, platform) => {
      if (platform.chain_identifier) {
        const chainId = platform.chain_identifier.toString()
        return { ...platformMapping, [chainId]: platform.id }
      }

      return platformMapping
    }, {})

    return allPlatforms
  } catch (e) {
    log.error('unable to load asset platform data', e)
  } finally {
    setTimeout(loadPlatforms, 60 * 1000)
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

async function loadRates (ids, chainId) {
  const platforms = await assetPlatforms() 
  const coinMapping = await coins()

  // lookupIds: { symbols: { [id]: symbol }, contracts: [address, ...] }
  const lookupIds = ids.reduce((lookups, rawId) => {
    // if id is a known symbol, use the CoinGecko id, otherwise it's
    // a contract address and can be looked up directly
    const id = rawId.toLowerCase()
    const symbolId = coinMapping[id]

    if (symbolId) {
      lookups.symbols = { ...lookups.symbols, [symbolId]: id }
    } else {
      lookups.contracts = [...lookups.contracts, id]
    }

    return lookups
  }, { contracts: [], symbols: {} })

  try {
    const symbolQuotes = await fetchPrices(Object.keys(lookupIds.symbols))
    const tokenQuotes = await fetchTokenPrices(lookupIds.contracts, platforms[chainId.toString()])

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
