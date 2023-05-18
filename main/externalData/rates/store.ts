import log from 'electron-log'
import { AssetId, AssetType } from '@framelabs/pylon-client/dist/assetId'

import store from '../../store'

import type { UsdRate } from '../../provider/assets'
import type { Rate } from '../../store/state'

type RateUpdate = {
  id: AssetId
  data: {
    usd: number
    usd_24h_change: number
  }
}

const RATES_EXPIRY = 1000 * 60 * 5 // rates are valid for 5 minutes before being considered stale
const timeouts: Record<string, NodeJS.Timer> = {}

const separateUpdates = (updates: RateUpdate[]) =>
  updates.reduce(
    (acc, update) => {
      return update.id.type === AssetType.NativeCurrency
        ? { ...acc, native: [...acc.native, update] }
        : { ...acc, token: [...acc.token, update] }
    },
    { native: [] as RateUpdate[], token: [] as RateUpdate[] }
  )

const gatherTokenRates = (updates: RateUpdate[]) =>
  updates.reduce((rates, update) => {
    const address = update.id.address as string

    rates[address] = {
      usd: {
        price: update.data.usd,
        change24hr: update.data.usd_24h_change
      }
    }

    return rates
  }, {} as Record<string, UsdRate>)

const storeApi = {
  setTokenRates: (rates: Record<Address, UsdRate>) => store.setRates(rates),
  removeTokenRate: (address: Address) => store.removeRate(address),
  setNativeCurrencyRate: (chainId: number, rate: Rate) =>
    store.setNativeCurrencyData('ethereum', chainId, { usd: rate }),
  removeNativeCurrencyRate: (chainId: number) => store.removeNativeCurrencyData('ethereum', chainId)
}

const handleNativeCurrencyUpdates = (updates: RateUpdate[]) => {
  log.debug(`got currency rate updates for chains: ${updates.map((u) => u.id.chainId)}`)

  updates.forEach((u) => {
    const id = `native:${u.id.chainId}`
    const expiry = setTimeout(() => storeApi.removeNativeCurrencyRate(u.id.chainId), RATES_EXPIRY)

    clearTimeout(timeouts[id])
    timeouts[id] = expiry

    storeApi.setNativeCurrencyRate(u.id.chainId, {
      price: u.data.usd,
      change24hr: u.data.usd_24h_change
    })
  })
}

const handleTokenUpdates = (updates: RateUpdate[]) => {
  log.debug(`got token rate updates for addresses: ${updates.map((u) => u.id.address)}`)

  const rates = gatherTokenRates(updates)
  storeApi.setTokenRates(rates)

  updates.forEach((u) => {
    const address = u.id.address as string
    const expiry = setTimeout(() => storeApi.removeTokenRate(address), RATES_EXPIRY)

    clearTimeout(timeouts[address])
    timeouts[address] = expiry
  })
}

const handleUpdates = (rates: RateUpdate[]) => {
  const { token, native } = separateUpdates(rates)

  if (native.length) {
    handleNativeCurrencyUpdates(native)
  }

  if (token.length) {
    handleTokenUpdates(token)
  }
}

export { handleUpdates }
