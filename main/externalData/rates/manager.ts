import log from 'electron-log'
import { AssetId, AssetType } from '@framelabs/pylon-client/dist/assetId'
import { UsdRate } from '../../provider/assets'
import { Rate } from '../../store/state'
import { RATES_EXPIRY_TIMEOUT } from '../../../resources/constants'

interface RateUpdate {
  id: AssetId
  data: {
    usd: number
    usd_24h_change: number
  }
}

interface GatheredUpdates {
  native: RateUpdate[]
  token: RateUpdate[]
}

type Rates = Record<string, UsdRate>

const separateUpdates = (updates: RateUpdate[]) => {
  return updates.reduce(
    (acc, update) => {
      if (!update.id.address) return acc
      return update.id.type === AssetType.NativeCurrency
        ? { ...acc, native: [...acc.native, update] }
        : { ...acc, token: [...acc.token, update] }
    },
    { native: [], token: [] } as GatheredUpdates
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

const StoreApi = (store: Store) => ({
  setTokenRates: (rates: Record<Address, UsdRate>) => store.setRates(rates),
  removeTokenRate: (address: Address) => store.removeRate(address),
  setNativeCurrencyRate: (chainId: number, rate: Rate) =>
    store.setNativeCurrencyData('ethereum', chainId, { usd: rate }),
  removeNativeCurrencyRate: (chainId: number) => store.removeNativeCurrencyData('ethereum', chainId)
})

function getRatesManager(store: Store) {
  const storeApi = StoreApi(store)
  const timers: Record<Address, NodeJS.Timer> = {}

  const startTimeout = (update: RateUpdate) => {
    const address = (update.id.address as Address).toLowerCase()
    const { chainId, type } = update.id
    if (timers[address]) {
      clearTimeout(timers[address])
    }
    timers[address] = setTimeout(() => {
      log.debug(`rate for token ${address} expired`)
      removeRate(address, chainId, type)
      delete timers[address]
    }, RATES_EXPIRY_TIMEOUT)
  }

  const removeRate = (address: string, chainId: number, type: AssetType) => {
    log.debug('removing rate', { address, chainId, type })
    if (type === AssetType.NativeCurrency) {
      storeApi.removeNativeCurrencyRate(chainId)
    } else {
      storeApi.removeTokenRate(address)
    }
  }

  const handleNativeUpdates = (updates: RateUpdate[]) => {
    log.debug(`got currency rate updates for chains: ${updates.map((u) => u.id.chainId)}`)
    updates.forEach((u) => {
      storeApi.setNativeCurrencyRate(u.id.chainId, {
        price: u.data.usd,
        change24hr: u.data.usd_24h_change
      })
      startTimeout(u)
    })
  }

  const handleTokenUpdates = (updates: RateUpdate[]) => {
    log.debug(`got token rate updates for addresses: ${updates.map((u) => u.id.address)}`)
    const rates = gatherTokenRates(updates)
    storeApi.setTokenRates(rates)
    updates.forEach(startTimeout)
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

  return {
    handleUpdates
  }
}

export default getRatesManager
