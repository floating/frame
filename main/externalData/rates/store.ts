import log from 'electron-log'
import { AssetId, AssetType } from '@framelabs/pylon-client/dist/assetId'

import store from '../../store'
import { RATES_EXPIRY_TIMEOUT } from '../../../resources/constants'

import type { UsdRate } from '../../provider/assets'
import type { Rate } from '../../store/state'

interface RateUpdate {
  id: AssetId
  data: {
    usd: number
    usd_24h_change: number
  }
}

type Rates = Record<string, UsdRate>

type Identifier = `0x${string}` | `native:${number}`

const toIdentifier = (update: RateUpdate) => {
  const { chainId, address } = update.id
  return (address?.toLowerCase() || `native:${chainId}`) as Identifier
}

const separateUpdates = (updates: RateUpdate[]) => {
  return updates.reduce(
    (acc, update) => {
      return update.id.type === AssetType.NativeCurrency
        ? { ...acc, native: [...acc.native, update] }
        : { ...acc, token: [...acc.token, update] }
    },
    { native: [] as RateUpdate[], token: [] as RateUpdate[] }
  )
}

const gatherTokenRates = (updates: RateUpdate[]) => {
  const rates = updates.reduce((rates, update) => {
    const address = update.id.address as string
    rates[address] = {
      usd: {
        price: update.data.usd,
        change24hr: update.data.usd_24h_change
      }
    }
    return rates
  }, {} as Rates)

  return rates
}

const storeApi = {
  setTokenRates: (rates: Record<Address, UsdRate>) => store.setRates(rates),
  removeTokenRate: (address: Address) => store.removeRate(address),
  setNativeCurrencyRate: (chainId: number, rate: Rate) =>
    store.setNativeCurrencyData('ethereum', chainId, { usd: rate }),
  removeNativeCurrencyRate: (chainId: number) => store.removeNativeCurrencyData('ethereum', chainId)
}

const timeouts: Record<Identifier, NodeJS.Timer> = {}

const handleNativeUpdates = (updates: RateUpdate[]) => {
  log.debug(`got currency rate updates for chains: ${updates.map((u) => u.id.chainId)}`)
  updates.forEach((u) => {
    const chainIdentifier = toIdentifier(u)
    clearTimeout(timeouts[chainIdentifier])
    storeApi.setNativeCurrencyRate(u.id.chainId, {
      price: u.data.usd,
      change24hr: u.data.usd_24h_change
    })
    const expiry = setTimeout(() => storeApi.removeNativeCurrencyRate(u.id.chainId), RATES_EXPIRY_TIMEOUT)
    timeouts[chainIdentifier] = expiry
  })
}

const handleTokenUpdates = (updates: RateUpdate[]) => {
  log.debug(`got token rate updates for addresses: ${updates.map((u) => u.id.address)}`)
  const rates = gatherTokenRates(updates)
  storeApi.setTokenRates(rates)
  updates.forEach((u) => {
    const address = toIdentifier(u)
    clearTimeout(timeouts[address])
    const expiry = setTimeout(() => storeApi.removeTokenRate(address), RATES_EXPIRY_TIMEOUT)
    timeouts[address] = expiry
  })
}

const handleUpdates = (rates: RateUpdate[]) => {
  const { token, native } = separateUpdates(rates)
  if (native.length) {
    handleNativeUpdates(native)
  }
  if (token.length) {
    handleTokenUpdates(token)
  }
}

export { handleUpdates }
