const log = require('electron-log')
const fetch = require('node-fetch')
const nebula = require('../../nebula')('tokenWorker')

// mapping of chainId to chain name according to Sushiswap token list naming convention
// https://github.com/sushiswap/default-token-list/tree/master/src/tokens
const chainMapping = {
  1: 'mainnet',
  3: 'ropsten',
  4: 'rinkeby',
  5: 'goerli',
  42: 'kovan',
  56: 'bsc',
  65: 'okex-testnet',
  66: 'okex',
  97: 'bsc-testnet',
  100: 'xdai',
  128: 'heco',
  137: 'matic',
  250: 'fantom',
  256: 'heco-testnet',
  1287: 'moonbase',
  4002: 'fantom-testnet',
  43113: 'fuji',
  43114: 'avalanche',
  80001: 'matic-testnet',
  1666600000: 'harmony',
  1666700000: 'harmony-testnet'
}

// attempt to load tokens from various sources in this order
const tokenListSources = [
  {
    name: 'sushiswap',
    list: sushiSwapTokens
  },
  {
    name: 'nebula',
    list: nebulaTokens
  }
]

const tokensForChain = (tokens, chainId) => tokens.filter(t => t.chainId === chainId)
const withLowerCaseAddress = token => ({ ...token, address: token.address.toLowerCase() })

async function sushiSwapTokens (chainId) {
  const chain = chainMapping[chainId]

  if (!chain) {
    log.warn(`unknown chain with id: ${chainId}`)
    return []
  }

  const url = `https://raw.githubusercontent.com/sushiswap/default-token-list/master/src/tokens/${chain}.json`

  log.debug(`loading sushiswap tokens from ${url}`)

  try {
    return await (await fetch(url)).json()
  } catch (e) {
    log.warn('could not load token list from sushiswap:', e)
    return []
  }
}

async function nebulaTokens (chainId) {
  let tokenList

  try {
    const tokenListRecord = await nebula.resolve('tokens.matt.eth')
    tokenList = await nebula.ipfs.getJson(tokenListRecord.record.content)
  } catch (e) {
    log.warn('could not load token list from Nebula, using default list', e)
    tokenList = require('./default-tokens.json').tokens
  }

  return tokensForChain(tokenList, chainId)
}

async function getTokenList (chainId) {
  log.debug(`loading token list for chainId=${chainId}`)

  const tokenList = await tokenListSources.reduce(async (tokens, source) => {
    log.debug(`loading tokens from ${source.name}`)

    const previouslyLoaded = await tokens
    const loaded = await source.list(chainId)

    log.info(`loaded ${loaded.length} tokens from ${source.name}`)

    loaded.forEach(token => {
      if (!(token.address in previouslyLoaded)) {
        previouslyLoaded[token.address] = withLowerCaseAddress(token)
      }
    })

    return loaded
  }, {})

  return Object.values(tokenList)
}

module.exports = getTokenList
