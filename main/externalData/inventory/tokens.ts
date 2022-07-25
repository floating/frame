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

  private readonly eth = ethProvider('frame', { name: 'tokenLoader' })
  private readonly nebula = nebulaApi(this.eth)

  constructor () {
    // token resolution uses mainnet ENS
    this.eth.setChain('0x1')

    this.tokenList = mergeTokens(
      sushiswapTokenList.tokens as Token[],
      defaultTokenList.tokens as TokenSpec[]
    )
  }

  private async loadTokenList () {
    const updatedTokens = await this.frameTokenList()

    this.tokenList = mergeTokens(this.tokenList, updatedTokens)
  
    log.info(`updated token list to contain ${this.tokenList.length} tokens`)
  }

  private async frameTokenList () {
    log.verbose('loading tokens from tokens.frame.eth')

    return new Promise<TokenSpec[]>(async resolve => {
      const requestTimeout = setTimeout(() => {
        log.warn('Timeout loading token list from tokens.frame.eth')
        resolve([])
      }, 8 * 1000)

      try {
        const tokenListRecord = await this.nebula.resolve('tokens.frame.eth')
        const tokenManifest: { tokens: TokenSpec[] } = await this.nebula.ipfs.getJson(tokenListRecord.record.content)

        clearTimeout(requestTimeout)

        const tokens = tokenManifest.tokens

        log.info(`loaded ${tokens.length} tokens from tokens.frame.eth`)

        resolve(tokens)
      } catch (e) {
        log.warn('Could not load token list from tokens.frame.eth', e)

        clearTimeout(requestTimeout)
        resolve([])
      }
    })
  }

  async start () {
    log.verbose('starting token loader')

    return new Promise<void>(resolve => {
      const startLoading = async () => {
        clearTimeout(connectTimeout)

        await this.loadTokenList()

        finishLoading()
      }

      const finishLoading = () => {
        this.eth.off('connect', onConnect)
        this.loader = setInterval(() => this.loadTokenList(), 1000 * 60 * 10)
        resolve()
      }

      const connectTimeout = setTimeout(() => {
        log.warn('Token loader could not connect to provider, using default list')
        finishLoading()
      }, 5 * 1000)

      const onConnect = startLoading.bind(this)

      if (this.eth.connected) return startLoading()

      this.eth.once('connect', onConnect)
    })
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
