const fetch = require('node-fetch')
const log = require('electron-log')

const apiVersion = process.env.COIN_GECKO_API_VERSION || 'v3'
const baseUrl = `https://api.coingecko.com/api/${apiVersion}`

async function handleJsonResponse (response) {
  const body = await response.json()

  if (response.status !== 200) throw new Error(JSON.stringify(body))

  return body
}

async function call (path, params = {}) {
  const queryStr = Object.entries(params).map(param => param.join('=')).join('&')
  const url = `${path}${queryStr ? '?' + queryStr : ''}`

  log.debug(`loading coingecko data from ${url}`)

  return fetch(url).then(handleJsonResponse)
}

async function assetPlatforms (chainIds = []) {
  const chainIdFilter = chainIds.map(id => id.toString())
  const allPlatforms = await call(`${baseUrl}/asset_platforms`)

  return chainIds.length > 0
    ? allPlatforms.filter(p => chainIdFilter.includes((p.chain_identifier || "").toString()))
    : allPlatforms
}

async function coinPrices (ids, currencies = ['usd']) {
  const queryParams = {
    ids: ids.join(','),
    vs_currencies: currencies.join(','),
    include_market_cap: 'true',
    include_24hr_vol: 'true',
    include_24hr_change: 'true'
  }

  return call(`${baseUrl}/simple/price`, queryParams)
}

async function tokenPrices (addresses, asset_platform, currencies = ['usd']) {
  const queryParams = {
    contract_addresses: addresses.join(','),
    vs_currencies: currencies.join(','),
    include_market_cap: 'true',
    include_24hr_vol: 'true',
    include_24hr_change: 'true'
  }

  return call(`${baseUrl}/simple/token_price/${asset_platform}`, queryParams)
}

async function getCoin (id) {
  return call(`${baseUrl}/coins/${id}`)
}

async function listCoins (include_platform = true) {
  return call(`${baseUrl}/coins/list?include_platform=${include_platform}`)
}

async function listMarkets (ids, vsCurrency = 'usd') {
  const queryParams = {
    vs_currency: vsCurrency,
    ids: ids.join(',')
  }

  return call(`${baseUrl}/coins/markets`, queryParams)
}

module.exports = {
  assetPlatforms,
  coinPrices,
  tokenPrices,
  getCoin,
  listCoins,
  listMarkets
}
