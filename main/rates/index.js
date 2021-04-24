const fetch = require('node-fetch')

// Get rates for symbols and store them


const rates = await _rates.json()
Object.keys(rates).forEach(token => {
  if (found[token]) {
    found[token].usdRate = rates[token].usd || 0
    const usdRateString = rates[token].usd.toString()
    found[token].usdDisplayRate = '$' + (parseInt(usdRateString.split('.')[0])).toLocaleString() + '.' + padRight(usdRateString.split('.')[1], 2)
    found[token].usdValue = Math.floor(found[token].floatBalance * found[token].usdRate * 100) / 100
    const usdValueString = found[token].usdValue.toString()
    found[token].usdDisplayValue = '$' + (parseInt(usdValueString.split('.')[0])).toLocaleString() + '.' + padRight(usdValueString.split('.')[1], 2)
  }
})

const watched = []
const add = (symbol) => {
  const id = symbolMapsymbolMap[symbol]
  if (coinList[id]) watched.push(id)
}

const symbolMap = {}
const coinList = {}
const symbolToId = (symbol) => symbolMap[symbol]
const idToSymbol = (id) => coinList[id] ? coinList[id].symbol : undefined
const getCoins = () => {
  // Fetch this once at the beginning 
  const _coins = await fetch(`https://api.coingecko.com/api/v3/coins/list`)
  const coins = await _coins.json()
  coins.forEach(coin => {
    coinList[coin.id] = coin
    symbolMap[coin.symbol] = coin.id
  })
}


setInterval(() => {
  const lookup = watched.map(coin => coin.id)
  // const _rates = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${Object.keys(found).join(',')}&vs_currencies=usd`)
  // https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd

  // const _rates = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${Object.keys(found).join(',')}&vs_currencies=usd`)

  const _rates = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${lookup.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`)
  const rates = await _rates.json()




}, 15 * 1000)