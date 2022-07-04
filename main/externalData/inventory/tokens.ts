import log from 'electron-log'

import ethProvider from 'eth-provider'

import nebulaApi from '../../nebula'
import defaultTokenList from './default-tokens.json'
import sushiswapTokenList from '@sushiswap/default-token-list'

interface TokenSpec extends Token {
  extensions: {
    omit: boolean
  }
}

function mergeTokens(existingTokens: Token[], updatedTokens: TokenSpec[]) {
  const omitList: string[] = []

  const mergedList = [existingTokens, updatedTokens].reduce((tokens, list) => {
    list.forEach((token) => {
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

  private readonly eth = ethProvider('frame', { origin: 'frame-internal', name: 'tokenLoader' })
  private readonly nebula = nebulaApi(this.eth)

  constructor() {
    this.tokenList = mergeTokens(sushiswapTokenList.tokens as Token[], defaultTokenList.tokens as TokenSpec[])
  }

  private async loadTokenList() {
    const updatedTokens = await this.frameTokenList()

    this.tokenList = mergeTokens(this.tokenList, updatedTokens)

    log.info(`updated token list to contain ${this.tokenList.length} tokens`)
  }

  async frameTokenList() {
    log.debug('loading tokens from tokens.frame.eth')

    try {
      const tokenListRecord = await this.nebula.resolve('tokens.frame.eth')
      const tokenManifest: { tokens: TokenSpec[] } = await this.nebula.ipfs.getJson(tokenListRecord.record.content)

      const tokens = tokenManifest.tokens

      log.info(`loaded ${tokens.length} tokens from tokens.frame.eth`)

      return tokens
    } catch (e) {
      log.warn('Could not load token list from tokens.frame.eth, using default list', e)
    }

    return []
  }

  async start() {
    log.verbose('starting token loader')

    return new Promise((resolve, reject) => {
      const connectTimeout = setTimeout(() => reject('could not connect to provider'), 30 * 1000)

      const startLoading = () => {
        clearTimeout(connectTimeout)
        this.loader = setInterval(() => this.loadTokenList(), 1000 * 60 * 10)
        resolve(this.loadTokenList())
      }

      if (this.eth.connected) return startLoading()

      this.eth.once('connect', startLoading.bind(this))
    })
  }

  stop() {
    if (this.loader) {
      clearInterval(this.loader)
      this.loader = null
    }
  }

  getTokens(chainId: number) {
    return this.tokenList.filter((token) => token.chainId === chainId)
  }
}
