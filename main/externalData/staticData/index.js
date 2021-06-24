const coingecko = require('../coingecko')
const log = require('electron-log')

function byMarketCap (coin1, coin2) {
  return coin1.market_cap - coin2.market_cap
}

async function loadCoinData (allCoins, symbol) {
  try {
    const ids = allCoins
      .filter(coin => coin.symbol.toLowerCase() === symbol.toLowerCase())
      .map(coin => coin.id)

    if (ids.length > 0) {
      const referenceData = await coingecko.listMarkets(ids)

      const sorted = referenceData.sort(byMarketCap)
      const coin = sorted.length > 0 ? sorted[0] : { name: '' }

      if (coin.name === 'Ethereum') coin.name = 'Ether'

      return coin
    }
  } catch (e) {
    log.error(`could not load coin data for ${symbol}`, e)
  }

  return {}
}

async function load (symbols) {
  const data = {}

  const allCoins = await coingecko.listCoins()

  for (const symbol of symbols) {
    const coinData = await loadCoinData(allCoins, symbol)

    if (coinData.name) {
      data[symbol] = {
        icon: coinData.image,
        name: coinData.name,
        usd: {
          price: coinData.current_price || 0,
          change24hr: coinData.price_change_percentage_24h || 0
        }
      }
    }
  }

  return data
}

module.exports = load
