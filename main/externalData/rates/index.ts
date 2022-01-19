import BigNumber from 'bignumber.js'
import log from 'electron-log'

import coingecko, { CoinId, PlatformId } from '../coingecko'

const FETCH_BATCH_SIZE = 200

// { symbol: coinId }
let allCoins: Record<string, CoinId>

// { chainId: platformId }
let allPlatforms: Record<number, PlatformId>

function createRate (quote: any): Rate {
  return {
    usd: {
      price: new BigNumber(quote.usd || 0),
      change24hr: new BigNumber(quote.usd_24h_change || 0)
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
    }, {} as Record<string, string>)

    return allCoins
  } catch (e) {
    log.error('unable to load coin data', e)
    throw e
  }
}

async function loadPlatforms () {
  try {
    const platforms = await coingecko.listAssetPlatforms()

    allPlatforms = platforms.reduce((platformMapping, platform) => {
      if (platform.chain_identifier) {
        const chainId = parseInt(platform.chain_identifier)
        return { ...platformMapping, [chainId]: platform.id }
      }

      return platformMapping
    }, {} as Record<number, string>)

    return allPlatforms
  } catch (e) {
    log.error('unable to load asset platform data', e)
    throw e
  }
}

async function fetchRates<T> (fetch: (ids: string[], ...params: any) => Promise<T>, ids: string[], params: string[] = []): Promise<T> {
  // have to batch the ids to avoid making the URL too large
  const batches = Object.keys([...Array(Math.ceil(ids.length / FETCH_BATCH_SIZE))])
    .map(batch => {
      const batchNumber = Number(batch)
      return ids.slice((batchNumber * FETCH_BATCH_SIZE), (batchNumber * FETCH_BATCH_SIZE) + FETCH_BATCH_SIZE)
    })

  const responses = await Promise.all(batches.map(batch => fetch(batch, ...params)))

  return Object.assign({}, ...responses)
}

const fetchCoinPrices = async (ids: string[]) => fetchRates(coingecko.coinPrices, ids)
const fetchTokenPrices = async (addresses: string[], platform: string) => fetchRates(coingecko.tokenPrices, addresses, [platform])

async function loadRates (ids: string[], chainId: number) {
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
  }, { contracts: [], symbols: {} } as any)

  try {
    const symbolQuotes = await fetchCoinPrices(Object.keys(lookupIds.symbols))
    const tokenQuotes = await fetchTokenPrices(lookupIds.contracts, platforms[chainId] || 'ethereum')

    return Object.entries({ ...symbolQuotes, ...tokenQuotes }).reduce((rates, [lookupId, quote]) => {
      const originalId = lookupIds.symbols[lookupId] || lookupId // could be symbol or contract address
      rates[originalId] = createRate(quote)

      return rates
    }, {} as Record<string, Rate>)
  } catch (e: any) {
    throw new Error(`unable to load latest rates: ${e.message}`)
  }
}

export default loadRates
