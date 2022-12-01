import BigNumber from 'bignumber.js'

const markets = [
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
    market_cap: 251086097383,
    current_price: 2157.2,
    price_change_percentage_24h: -8.85019,
  },
  {
    id: 'xdai',
    symbol: 'xdai',
    name: 'xDAI',
    image: 'https://assets.coingecko.com/coins/images/11062/large/xdai.png?1614727492',
    market_cap: 0.0,
    current_price: 1.0,
    price_change_percentage_24h: 0.19833,
  },
  {
    id: 'matic-network',
    symbol: 'matic',
    name: 'Polygon',
    image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1624446912',
    market_cap: 6775636839,
    current_price: 1.07,
    price_change_percentage_24h: -7.31834,
  },
]

const platforms = [
  {
    id: 'ethereum',
    chain_identifier: '1',
    name: 'Ethereum',
    short_name: '',
  },
  {
    id: 'xdai',
    chain_identifier: '100',
    name: 'xDAI',
    short_name: '',
  },
]

const tokenPriceData = {
  ethereum: {
    '0xd3c89cac4a4283edba6927e2910fd1ebc14fe006': new BigNumber(0.184269),
    '0xe41d2489571d322189246dafa5ebde1f4699f498': new BigNumber(0.797079),
  },
  xdai: {
    '0x71850b7e9ee3f13ab46d67167341e4bdc905eef9': new BigNumber(388.15),
    '0x1e16aa4df73d29c029d94ceda3e3114ec191e25a': new BigNumber(0.079163),
  },
}

const customCoins = []

const __clearCustomCoins = () => customCoins.splice(0, customCoins.length)

const __addCoin = (coin) => {
  customCoins.push(coin)
}

const listAssetPlatforms = async () => platforms
const listCoins = async () => {
  return markets.concat(customCoins).map((mkt) => ({
    id: mkt.id,
    symbol: mkt.symbol,
    name: mkt.name,
  }))
}

const listMarkets = async (ids) => {
  if (!ids) return markets

  return markets.concat(customCoins).filter((mkt) => ids.includes(mkt.id))
}

const coinPrices = async () => []
const tokenPrices = async (addresses, platform) => {
  return addresses.reduce((allPrices, address) => {
    const price = (tokenPriceData[platform] || {})[address]

    if (price) {
      return { ...allPrices, [address]: { usd: price } }
    }

    return allPrices
  }, {})
}

export default {
  listAssetPlatforms,
  listCoins,
  listMarkets,
  coinPrices,
  tokenPrices,
  __clearCustomCoins,
  __addCoin,
}
