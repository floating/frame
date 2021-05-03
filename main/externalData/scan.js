const ethProvider = require('eth-provider')

// TODO: use cross chain provider
// const nebula = require('../nebula')

const ethNode = process.env.NODE_ENV === 'production'
  ? 'wss://mainnet.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'
  : 'wss://rinkeby.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'

const nebula = require('nebula')(
  'https://ipfs.nebula.land', ethProvider(ethNode)
)

const getTokenBalances = require('./tokens')
const coins = require('./coins')
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

  const coinBalances = (await coins(provider).getCoinBalances(chain, address))
  const foundTokens = await getTokenBalances(chain, address, tokens)

  const tokenBalances = Object.entries(foundTokens).reduce((found, [sym, balance]) => {
    const symbol = sym.toLowerCase()

    if (balance.isZero() || symbolsToOmit.includes(symbol)) return found

    const token = tokens.find(t => t.symbol === symbol)

    if (token) {
      found[symbol] = {
        ...token,
        balance
      }
    }

    return found
  }, {})

  return { ...coinBalances, ...tokenBalances }
}

module.exports = scan
