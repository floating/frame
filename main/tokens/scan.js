const ethProvider = require('eth-provider')

// TODO: use cross chain provider
// const nebula = require('../nebula')

const ethNode = process.env.NODE_ENV === 'production'
  ? 'wss://mainnet.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'
  : 'wss://rinkeby.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'

const nebula = require('nebula')(
  'https://ipfs.nebula.land', ethProvider(ethNode)
)

const getTokenBalances = require('./balance')
const rates = require('../rates')

const provider = ethProvider('frame', { name: 'tokenWorker' })

async function chainId () {
  return parseInt(await provider.request({ method: 'eth_chainId' }))
}

async function getTokenList (chainId) {
  const tokenListRecord = await nebula.resolve('tokens.matt.eth')
  const tokenList = await nebula.ipfs.getJson(tokenListRecord.record.content)

  return tokenList.tokens
    .filter(t => t.chainId === chainId)
    .map(t => ({ ...t, symbol: t.symbol.toLowerCase() }))
}

async function scan (address, omit = [], knownList) {
  const symbolsToOmit = omit.map(a => a.toLowerCase())

  const chain = await chainId()
  const tokens = await getTokenList(chain)

  const tokenBalances = await getTokenBalances(chain, address, tokens)

  const found = Object.entries(tokenBalances).reduce((found, [sym, balance]) => {
    const symbol = sym.toLowerCase()

    if (balance.isZero() || symbolsToOmit.includes(symbol)) return found

    const token = tokens.find(t => t.symbol === symbol)

    if (token) {
      const rate = rates.add([symbol])[symbol]

      found[symbol] = {
        ...token,
        balance,
        usdRate: rate.usd
      }
    }

    return found
  }, {})

  return found
}

module.exports = scan
