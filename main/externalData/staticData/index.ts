import { listMarkets, listCoins, Market, Coin } from '../coingecko'
import log from 'electron-log'

function byMarketCap (coin1: Market, coin2: Market) {
  return coin1.market_cap - coin2.market_cap
}

async function loadCoinData (allCoins: Coin[], symbol: string): Promise<Market> {
  const defaultMarket: Market = {
    symbol,
    id: symbol.toLowerCase(),
    name: symbol.toUpperCase(),
    image: undefined,
    current_price: 0,
    price_change_percentage_24h: 0
  }

  try {
    const ids = allCoins
      .filter(coin => coin.symbol.toLowerCase() === symbol.toLowerCase())
      .map(coin => coin.id)

    if (ids.length > 0) {
      const referenceData = await listMarkets(ids)

      const sorted = referenceData.sort(byMarketCap)
      const coin = sorted.length > 0 ? sorted[0] : defaultMarket

      if (coin.name === 'Ethereum') coin.name = 'Ether'

      return coin
    }
  } catch (e) {
    log.error(`could not load coin data for ${symbol}`, e)
  }

  return defaultMarket
}

async function load (symbols: string[]) {
  const data = {}

  const allCoins = await listCoins()

  for (const symbol of symbols) {
    const coinData = await loadCoinData(allCoins, symbol)

      data[symbol] = {
        icon: coinData.image,
        name: coinData.name,
        usd: {
          price: coinData.current_price || 0,
          change24hr: coinData.price_change_percentage_24h || 0
        }
      }
  }

  return data
}

module.exports = load
