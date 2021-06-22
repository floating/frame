const provider = require('eth-provider')()
const BigNumber = require('bignumber.js')

const getTokenList = require('./inventory/tokens')
const getTokenBalances = require('./tokens')

async function chainId () {
  return parseInt(await provider.request({ method: 'eth_chainId' }))
}

async function getNativeCoinBalance (address) {
  const rawBalance = await provider.request({ method: 'eth_getBalance', params: [address, 'latest'] })

  // TODO how to shift the balance, are all coins the same?
  return BigNumber(rawBalance).shiftedBy(-18)
}

async function scan (address, omit = [], knownList) {
  const symbolsToOmit = omit.map(a => a.toLowerCase())

  const chain = await chainId()
  const tokens = await getTokenList(chain)

  // Emit progress asap, needs better pattern
  const coinBalance = await getNativeCoinBalance(address)
  process.send({ type: 'coinBalance', netId: chain, address, coinBalance: coinBalance })

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

  return tokenBalances
}

module.exports = scan
