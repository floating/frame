import log from 'electron-log'

import Pylon, { AssetType } from '@framelabs/pylon-client'
import { AssetId } from '@framelabs/pylon-client/dist/assetId'
import store from '../../store'

const storeApi = {
  setNativeCurrencyRate: (chainId: number, rate: Rate) => store.setNativeCurrencyData('ethereum', chainId, rate),
  setTokenRates: (rates: Record<Address, Rate>) => store.setRates(rates)
}

export default function rates (pylon: Pylon, store: Store) {
  function handleUpdates (updates: any[]) {
    if (updates.length === 0) return

    const nativeCurrencyUpdates = updates.filter(u => u.id.type === AssetType.NativeCurrency)

    if (nativeCurrencyUpdates.length > 0) {
      log.verbose(`got currency rate updates for chains: ${nativeCurrencyUpdates.map(u => u.id.chainId)}`)
      
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
      log.verbose(`got token rate updates for addresses: ${tokenUpdates.map(u => u.id.address)}`)

      const tokenRates = tokenUpdates.reduce((allRates, update) => {
        allRates[update.id.address] = {
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

  function start () {
    pylon.on('rates', handleUpdates)
  }

  function stop () {
    pylon.rates([])
    pylon.off('rates', handleUpdates)
  }

  function setAssets (assetIds: AssetId[]) {
    log.verbose(`rates.setAddresses(${assetIds})`)
    pylon.rates(assetIds)
  }

  return {
    start, stop, setAssets
  }
}
