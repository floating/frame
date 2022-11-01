import log from 'electron-log'

import Pylon, { AssetType } from '@framelabs/pylon-client'
import { AssetId } from '@framelabs/pylon-client/dist/assetId'

interface RateUpdate {
  id: AssetId
  data: {
    usd: number
    usd_24h_change: number
  }
}

interface ChainUpdate {
  id: number
  data: {
    chainId: number
    nativeCurrency: {
      symbol: string
      iconURI: string
      name: string
      decimals?: number
    }
  }
}

export default function rates (pylon: Pylon, store: Store) {
  const storeApi = {
    getKnownTokens: (address?: Address) => ((address && store('main.tokens.known', address)) || []) as Token[],
    setNativeCurrencyData: (chainId: number, currencyData: NativeCurrency) => store.setNativeCurrencyData('ethereum', chainId, currencyData),
    setNativeCurrencyRate: (chainId: number, rate: Rate) => store.setNativeCurrencyData('ethereum', chainId, rate),
    setTokenRates: (rates: Record<Address, Rate>) => store.setRates(rates)
  }

  function handleRatesUpdates (updates: RateUpdate[]) {
    if (updates.length === 0) return

    const nativeCurrencyUpdates = updates.filter(u => u.id.type === AssetType.NativeCurrency)

    if (nativeCurrencyUpdates.length > 0) {
      log.debug(`got currency rate updates for chains: ${nativeCurrencyUpdates.map(u => u.id.chainId)}`)
      
      nativeCurrencyUpdates.forEach(u => {
        storeApi.setNativeCurrencyRate(u.id.chainId, {
          usd: {
            price: u.data.usd,
            change24hr: u.data.usd_24h_change
          }
        })
      })
    }

    const tokenUpdates = updates.filter(u => u.id.type === AssetType.Token)

    if (tokenUpdates.length > 0) {
      log.debug(`got token rate updates for addresses: ${tokenUpdates.map(u => u.id.address)}`)

      const tokenRates = tokenUpdates.reduce((allRates, update) => {
        // address is always defined for tokens
        const address = update.id.address as string
        
        allRates[address] = {
          usd: {
            price: update.data.usd,
            change24hr: update.data.usd_24h_change
          }
        }

        return allRates
      }, {} as Record<string, Rate>)

      storeApi.setTokenRates(tokenRates)
    }
  }

  // function handleChainUpdates (updates: ChainUpdate[]) {
  //   if (updates.length === 0) return

  //   log.debug(`got chain updates for ${updates.map(u => u.id)}`)
    
  //   updates.forEach(update => {
  //     const { chainId, nativeCurrency } = update.data
  //     const { iconURI, name, symbol, decimals } = nativeCurrency

  //     storeApi.setNativeCurrencyData(chainId, {
  //       icon: iconURI,
  //       name,
  //       symbol,
  //       decimals: decimals || 18
  //     })
  //   })
  // }

  function updateSubscription (chains: number[], address?: Address) {
    const subscribedCurrencies = chains.map(chainId => ({ type: AssetType.NativeCurrency, chainId }))
    const knownTokens = storeApi.getKnownTokens(address).filter(token => chains.includes(token.chainId))
    const subscribedTokens = knownTokens.map(token => ({ type: AssetType.Token, chainId: token.chainId, address: token.address }))

    setAssets([
      ...subscribedCurrencies,
      ...subscribedTokens
    ])
  }

  function start () {
    log.verbose('starting asset updates')

    pylon.on('rates', handleRatesUpdates)
  }

  function stop () {
    log.verbose('stopping asset updates')

    pylon.off('rates', handleRatesUpdates)
    // pylon.off('chains', handleChainUpdates)

    pylon.rates([])
  }

  function setAssets (assetIds: AssetId[]) {

    log.verbose('subscribing to rates updates for native currencies on chains:', assetIds.filter(a => a.type === AssetType.NativeCurrency).map(a => a.chainId))
    log.verbose('subscribing to rates updates for tokens:', assetIds.filter(a => a.type === AssetType.Token).map(a => a.address))
    // log.verbose('subscribing to chain updates for chains:', chains)

    pylon.rates(assetIds)
  }

  return {
    start, stop, setAssets, updateSubscription
  }
}
