
const BigNumber = require('bignumber.js')

const chainCoins = {
  1: {
    name: 'Ether',
    logoURI: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png?1595348880',
    symbol: 'eth',
    decimals: 18
  },
  100: {
    name: 'xDai',
    logoURI: 'https://assets.coingecko.com/coins/images/11062/small/xdai.png?1614727492',
    symbol: 'xdai',
    decimals: 18
  }
}

module.exports = function (eth) {
  return {
    getCoinBalances: async function (chainId, address) {
      const nativeCoin = chainCoins[chainId]

      if (nativeCoin) {
        const symbol = nativeCoin.symbol.toLowerCase()
        const rawBalance = await eth.request({ method: 'eth_getBalance', params: [address, 'latest'] })

        const balance = BigNumber(rawBalance).shiftedBy(-nativeCoin.decimals)

        return {
          [symbol]: {
            ...nativeCoin,
            balance
          }
        }
      }

      return {}
    }
  }
}
