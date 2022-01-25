import log from 'electron-log'
import nebulaApi from '../../nebula'

const nebula = nebulaApi('tokenWorker')

import defaultTokenList from './default-tokens.json'
import sushiswapTokenList from '@sushiswap/default-token-list'

interface TokenSpec extends Token {
  extensions: {
    omit: boolean
  }
}

async function frameTokenList () {
  log.debug('loading tokens from tokens.frame.eth')

  try {
    const tokenListRecord = await nebula.resolve('tokens.frame.eth')
    const tokenManifest: { tokens: TokenSpec[] } = await nebula.ipfs.getJson(tokenListRecord.record.content)

    const tokens = tokenManifest.tokens

    log.info(`loaded ${tokens.length} tokens from tokens.frame.eth`)

    return tokens
  } catch (e) {
    log.warn('Could not load token list from tokens.frame.eth, using default list', e)
  }

  return []
}

function mergeTokens (existingTokens: Token[], updatedTokens: TokenSpec[]) {
  const omitList: string[] = []

  const mergedList = [existingTokens, updatedTokens].reduce((tokens, list) => {
    list.forEach(token => {
      const address = token.address.toLowerCase()
      const key = `${token.chainId}:${address}`
      const omitToken = ((token as any).extensions || {}).omit

      if (omitToken) {
        omitList.push(key)
        delete tokens[key]
      } else if (!omitList.includes(key) && !(key in tokens)) {
        tokens[key] = { ...token, address }
      }
    })

    return tokens
  }, {} as { [key: string]: Token })

  return Object.values(mergedList)
}

export default class TokenLoader {
  private tokenList: Token[] = []
  private loader?: NodeJS.Timeout | null

  constructor () {
    this.tokenList = mergeTokens(
      sushiswapTokenList.tokens as Token[],
      defaultTokenList.tokens as TokenSpec[]
    )
  }

  private async loadTokenList () {
    const updatedTokens = await frameTokenList()
  
    this.tokenList = mergeTokens(this.tokenList, updatedTokens)
  
    log.info(`updated token list to contain ${this.tokenList.length} tokens`)
  }

  async start () {
    await this.loadTokenList()
    this.loader = setInterval(() => this.loadTokenList(), 1000 * 60 * 10)
  }
  
  stop () {
    if (this.loader) {
      clearInterval(this.loader)
      this.loader = null
    }
  }

  getTokens (chainId: number) {
    return this.tokenList.filter(token => token.chainId === chainId)
  }
}
