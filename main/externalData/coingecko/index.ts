import log from 'electron-log'
import fetch from 'node-fetch'

interface JsonResponse {
  status: number
  json: () => Promise<any>
}

interface Rates {
  [key: string]: Quote // id => quote
}

interface Quote {
  usd: number
  usd_24h_change: number
}

export type CoinId = string

export interface Coin {
  id: CoinId
  symbol: string
  name: string
  asset_platform_id: string
  platforms?: {}
}

export type PlatformId = string

export interface Platform {
  id: PlatformId
  chain_identifier: string
  name: string
  short_name: string
}

export interface Market {
  id: string
  symbol: string
  name: string
  image: string
  current_price?: number
  market_cap?: number
  price_change_percentage_24h?: number
}

const apiVersion = process.env.COIN_GECKO_API_VERSION || 'v3'
const baseUrl = `https://api.coingecko.com/api/${apiVersion}`

async function handleJsonResponse(response: JsonResponse) {
  const body = await response.json()

  if (response.status !== 200) throw new Error(JSON.stringify(body))

  return body
}

async function call(path: string, params = {}) {
  const queryStr = Object.entries(params)
    .map((param) => param.join('='))
    .join('&')
  const url = `${path}${queryStr ? '?' + queryStr : ''}`

  log.debug(`loading coingecko data from ${url}`)

  return fetch(url, {}).then(handleJsonResponse)
}

async function listAssetPlatforms(chainIds: string[] = []): Promise<Array<Platform>> {
  const chainIdFilter = chainIds.map((id) => id.toString())
  const allPlatforms: Platform[] = await call(`${baseUrl}/asset_platforms`)

  return chainIds.length > 0
    ? allPlatforms.filter((p) => chainIdFilter.includes((p.chain_identifier || '').toString()))
    : allPlatforms
}

async function coinPrices(ids: string[], currencies = ['usd']): Promise<Rates> {
  const queryParams = {
    ids: ids.join(','),
    vs_currencies: currencies.join(','),
    include_market_cap: 'true',
    include_24hr_vol: 'true',
    include_24hr_change: 'true',
  }

  return call(`${baseUrl}/simple/price`, queryParams)
}

async function tokenPrices(
  addresses: string[],
  asset_platform: string,
  currencies = ['usd']
): Promise<Rates> {
  const queryParams = {
    contract_addresses: addresses.join(','),
    vs_currencies: currencies.join(','),
    include_market_cap: 'true',
    include_24hr_vol: 'true',
    include_24hr_change: 'true',
  }

  return call(`${baseUrl}/simple/token_price/${asset_platform}`, queryParams)
}

async function getCoin(id: string): Promise<Coin> {
  return call(`${baseUrl}/coins/${id}`)
}

async function listCoins(include_platform = true): Promise<Array<Coin>> {
  return call(`${baseUrl}/coins/list?include_platform=${include_platform}`)
}

async function listMarkets(ids: string[], vsCurrency = 'usd'): Promise<Array<Market>> {
  const queryParams = {
    vs_currency: vsCurrency,
    ids: ids.join(','),
  }

  return call(`${baseUrl}/coins/markets`, queryParams)
}

export default {
  listAssetPlatforms,
  coinPrices,
  tokenPrices,
  getCoin,
  listCoins,
  listMarkets,
}
