const fetch = require('node-fetch')
const log = require('electron-log')

const apiVersion = process.env.COIN_GECKO_API_VERSION || 'v3'
const baseUrl = `https://api.coingecko.com/api/${apiVersion}`
//${path}${batchIds}&vs_currencies=${vsCurrencies}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`

async function handleJsonResponse (response) {
  const body = await response.json()

  if (response.status !== 200) throw new Error(JSON.stringify(body))

  return body
}

async function price () {

}

async function tokenPrice () {

}

async function getCoin (id) {
  const url = `${baseUrl}/coins/${id}`

  log.debug(`loading coin data from ${url}`)

  return fetch(url).then(handleJsonResponse)
}

async function listCoins () {
  const url = `${baseUrl}/coins/list`

  log.debug(`loading coin list from ${url}`)

  return fetch(url).then(handleJsonResponse)
}

async function listMarkets (ids, vsCurrency = 'usd') {
  const url = `${baseUrl}/coins/markets?vs_currency=${vsCurrency}&ids=${ids.join(',')}`

  log.debug(`loading coin markets from ${url}`)

  return fetch(url).then(handleJsonResponse)
}

module.exports = {
  price,
  tokenPrice,
  getCoin,
  listCoins,
  listMarkets
}
