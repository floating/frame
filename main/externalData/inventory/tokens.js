import log from 'electron-log'
import nebulaApi from '../../nebula'

const nebula = nebulaApi('tokenWorker')
const tokenListPath = '/ipns/k51qzi5uqu5dgj8vqkoy9ctids6zfwn53tazlfgqv44svb0ktdkdw02qopy1y1'

let tokenList = mergeTokens(
  require('@sushiswap/default-token-list').tokens,
  require('./default-tokens.json').tokens
)

async function frameTokenList () {
  log.debug('loading tokens from tokens.frame.eth')

  try {
    // FIXME: put this back when ENS record is updated correctly
    // const tokenListRecord = await nebula.resolve('tokens.frame.eth')
    // const tokens = (await nebula.ipfs.getJson(tokenListRecord.record.content)).tokens

    const tokens = (await nebula.ipfs.getJson(tokenListPath)).tokens

    log.info(`loaded ${tokens.length} tokens from tokens.frame.eth`)

    return tokens
  } catch (e) {
    log.warn('Could not load token list from tokens.frame.eth, using default list', e)
  }

  return []
}

function mergeTokens (...tokenLists) {
  const omitList = []

  const mergedList = tokenLists.reduce((tokens, list) => {
    list.forEach(token => {
      const address = token.address.toLowerCase()
      const key = `${token.chainId}:${address}`
      const omitToken = (token.extensions || {}).omit

      if (omitToken) {
        omitList.push(key)
        delete tokens[key]
      } else if (!omitList.includes(key) && !(key in tokens)) {
        tokens[key] = { ...token, address }
      }
    })

    return tokens
  }, {})

  return Object.values(mergedList)
}

async function loadTokenList () {
  const updatedTokens = await frameTokenList()

  tokenList = mergeTokens(tokenList, updatedTokens)

  log.info(`updated token list to contain ${tokenList.length} tokens`)
}

let loader

export default {
  start: () => {
    loadTokenList()
    loader = setInterval(loadTokenList, 1000 * 60 * 10)
  },
  stop: () => {
    if (loader) {
      clearInterval(loader)
      loader = null
    }
  },
  getTokens: chainId => tokenList.filter(token => token.chainId === chainId)
}
