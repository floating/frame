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
const { tokens } = require('./tokens.json')

const mainnetTokens = tokens.filter(t => t.chainId === 1)
const tokenAddresses = mainnetTokens.map(t => t.address.toLowerCase())

const provider = ethProvider('frame', { name: 'tokenWorker' })

async function chainId () {
  return parseInt(await provider.request({ method: 'eth_chainId' }))
}

async function getTokenList (chainId) {
  const tokenListRecord = await nebula.resolve('tokens.matt.eth')
  const tokenList = await nebula.ipfs.getJson(tokenListRecord.record.content)

  return tokenList.tokens.filter(t => t.chainId === chainId)
}

const scan = async (address, omitList = [], knownList) => {
  const omit = omitList.map(a => a.toLowerCase())
  const list = (knownList || tokenAddresses).map(a => a.toLowerCase()).filter(a => omit.indexOf(a) === -1)

  const chain = await chainId()
  const tokens = await getTokenList(chain)
  const tokenBalances = await getTokenBalances(chain, address, tokens)

  const found = Object.entries(tokenBalances).reduce((found, [symbol, balance]) => {
    if (balance.isZero()) return found

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
