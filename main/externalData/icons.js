const coingecko = require('./coingecko')
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
      const coin = sorted.length > 0 ? sorted[0] : { id: '' }

      return await coingecko.getCoin(coin.id)
    }
  } catch (e) {
    log.error(`could not load coin data for ${symbol}`, e)
  }

  return {}
}

async function getIcons (symbols) {
  const icons = {}

  const allCoins = await coingecko.listCoins()

  for (const symbol of symbols) {
    const coinData = await loadCoinData(allCoins, symbol)
    const image = coinData.image || {}

    icons[symbol] = image.small || image.thumb
  }

  return icons
}

module.exports = getIcons
