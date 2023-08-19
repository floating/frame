import log from 'electron-log'
import { AssetType } from '@framelabs/pylon-client/dist/assetId'

import { storeApi } from '../storeApi'
import { toTokenId } from '../../../resources/domain/balance'

import type { AssetId } from '@framelabs/pylon-client/dist/assetId'
import type { Rate, WithTokenId } from '../../store/state/types'

type RateUpdate = {
  id: AssetId
  data: {
    usd: number
    usd_24h_change: number
  }
}

const RATES_EXPIRY = 1000 * 5 * 60 // rates are valid for 5 minutes before being considered stale
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
    const tokenId = toTokenId(update.id as WithTokenId)

    rates[tokenId] = {
      usd: {
        price: update.data.usd,
        change24hr: update.data.usd_24h_change
      }
    }

    return rates
  }, {} as Record<string, Record<string, Rate>>)

const handleNativeCurrencyUpdates = (updates: RateUpdate[]) => {
  log.debug('Handling native currency rate updates', { chains: updates.map((u) => u.id.chainId) })

  updates.forEach((u) => {
    storeApi.setNativeCurrencyRate(u.id.chainId, {
      price: u.data.usd,
      change24hr: u.data.usd_24h_change
    })

    const id = `native:${u.id.chainId}`
    const expiry = setTimeout(() => storeApi.removeNativeCurrencyRate(u.id.chainId), RATES_EXPIRY)

    clearTimeout(timeouts[id])
    timeouts[id] = expiry
  })
}

const handleTokenUpdates = (updates: RateUpdate[]) => {
  log.debug('Handling token rate updates', { addresses: updates.map((u) => u.id.address) })

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
