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

    const referenceData = await coingecko.listMarkets(ids)

    const coin = referenceData.sort(byMarketCap)[0]

    return await coingecko.getCoin(coin.id)
  } catch (e) {
    log.error(`could not load coin data for ${symbol}`, e)
    return { image: {} }
  }
}

async function getIcons (symbols) {
  const icons = {}

  const allCoins = await coingecko.listCoins()

  for (const symbol of symbols) {
    const coinData = await loadCoinData(allCoins, symbol)

    icons[symbol] = coinData.image.small || coinData.image.thumb
  }

  return icons
}

module.exports = getIcons
