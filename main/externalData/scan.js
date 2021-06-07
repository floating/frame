const provider = require('eth-provider')()

const getTokenList = require('./inventory/tokens')
const getTokenBalances = require('./tokens')
const coins = require('./coins')

async function chainId () {
  return parseInt(await provider.request({ method: 'eth_chainId' }))
}

async function scan (address, omit = [], knownList) {
  const symbolsToOmit = omit.map(a => a.toLowerCase())

  const chain = await chainId()
  const tokens = await getTokenList(chain)

  const coinBalances = (await coins(provider).getCoinBalances(chain, address))
  // Emit progress asap, needs better pattern
  process.send({ type: 'tokens', netId: chain, address, found: coinBalances })
  const foundTokens = await getTokenBalances(chain, address, tokens)

  const tokenBalances = Object.entries(foundTokens).reduce((found, [addr, balance]) => {
    const address = addr.toLowerCase()
    const token = tokens.find(t => t.address === address)
    const symbol = token.symbol.toLowerCase()

    if (balance.isZero() || symbolsToOmit.includes(symbol)) return found

    if (token) {
      found[address] = {
        ...token,
        balance
      }
    }

    return found
  }, {})

  return { ...coinBalances, ...tokenBalances }
}

module.exports = scan
