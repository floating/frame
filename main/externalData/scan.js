const log = require('electron-log')
const provider = require('eth-provider')()

const nebula = require('../nebula')('tokenWorker')
const getTokenBalances = require('./tokens')
const coins = require('./coins')

async function chainId () {
  return parseInt(await provider.request({ method: 'eth_chainId' }))
}

async function getTokenList (chainId) {
  let tokenList

  try {
    const tokenListRecord = await nebula.resolve('tokens.matt.eth')
    tokenList = await nebula.ipfs.getJson(tokenListRecord.record.content)
  } catch (e) {
    log.warn('could not load token list, using default', e)
    tokenList = require('./default-tokens.json')
  }

  return tokenList.tokens
    .filter(t => t.chainId === chainId)
    .map(t => ({ ...t, address: t.address.toLowerCase() }))
}

async function scan (address, omit = [], knownList) {
  const symbolsToOmit = omit.map(a => a.toLowerCase())

  const chain = await chainId()
  const tokens = await getTokenList(chain)

  const coinBalances = (await coins(provider).getCoinBalances(chain, address))
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
