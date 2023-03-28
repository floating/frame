import log from 'electron-log'

import ethProvider from 'eth-provider'

import nebulaApi from '../../nebula'
import defaultTokenList from './default-tokens.json'

const TOKENS_ENS_DOMAIN = 'tokens.frame.eth'

interface TokenSpec extends Token {
  extensions?: {
    omit?: boolean
  }
}

function isBlacklisted(token: TokenSpec) {
  return token.extensions?.omit
}

export default class TokenLoader {
  private tokens: TokenSpec[] = defaultTokenList.tokens as TokenSpec[]
  private nextLoad?: NodeJS.Timeout | null

  private readonly eth = ethProvider('frame', { origin: 'frame-internal', name: 'tokenLoader' })
  private readonly nebula = nebulaApi(this.eth)

  constructor() {
    this.eth.setChain('0x1')
  }

  private async loadTokenList(timeout = 60_000) {
    try {
      const updatedTokens = await this.fetchTokenList(timeout)
      log.info(`Fetched ${updatedTokens.length} tokens`)
      this.tokens = updatedTokens
      log.info(`Updated token list to contain ${this.tokens.length} tokens`)

      this.nextLoad = setTimeout(() => this.loadTokenList(), 10 * 60_000)
    } catch (e) {
      log.warn('Could not fetch token list', e)
      this.nextLoad = setTimeout(() => this.loadTokenList(), 30_000)
    }
  }

  private async fetchTokenList(timeout: number) {
    log.verbose(`Fetching tokens from ${TOKENS_ENS_DOMAIN}`)

    return new Promise<TokenSpec[]>((resolve, reject) => {
      const requestTimeout = setTimeout(() => {
        reject(`Timeout fetching token list from ${TOKENS_ENS_DOMAIN}`)
      }, timeout)

      try {
        ;(async () => {
          const tokenListRecord = await this.nebula.resolve(TOKENS_ENS_DOMAIN)
          const tokenManifest: { tokens: TokenSpec[] } = await this.nebula.ipfs.getJson(
            tokenListRecord.record.content
          )
          const tokens = tokenManifest.tokens

          resolve(tokens)
        })()
      } catch (e) {
        reject(e)
      } finally {
        clearTimeout(requestTimeout)
      }
    })
  }

  async start() {
    log.verbose('Starting token loader')

    return new Promise<void>((resolve) => {
      const startLoading = async () => {
        clearTimeout(connectTimeout)

        // use a lower timeout for the first load
        await this.loadTokenList(8000)

        finishLoading()
      }

      const finishLoading = () => {
        this.eth.off('connect', onConnect)
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

  stop() {
    if (this.nextLoad) {
      clearInterval(this.nextLoad)
      this.nextLoad = null
    }
  }

  getTokens(chains: number[]) {
    return this.tokens.filter((token) => !isBlacklisted(token) && chains.includes(token.chainId))
  }

  getBlacklist(chains: number[] = []) {
    const chainMatches = (token: TokenSpec) => !chains.length || chains.includes(token.chainId)

    return this.tokens.filter((token) => isBlacklisted(token) && chainMatches(token))
  }
}
