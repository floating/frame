import store from '../../store'

import { NATIVE_CURRENCY } from '../../../resources/constants'

export type UsdRate = { usd: Rate }

interface AssetsChangedHandler {
  assetsChanged: (address: Address, assets: RPC.GetAssets.Assets) => void
}

// typed access to state
const storeApi = {
  getBalances: (account: Address): Balance[] => {
    return store('main.balances', account) || []
  },
  getNativeCurrency: (chainId: number): NativeCurrency => {
    const currency = store('main.networksMeta.ethereum', chainId, 'nativeCurrency')

    return currency || { usd: { price: 0 } }
  },
  getUsdRate: (address: Address): UsdRate => {
    const rate = store('main.rates', address.toLowerCase())

    return rate || { usd: { price: 0 } }
  },
  getLastUpdated: (account: Address): number => {
    return store('main.accounts', account, 'balances.lastUpdated')
  }
}

function createObserver(handler: AssetsChangedHandler) {
  let debouncedAssets: RPC.GetAssets.Assets | null = null

  return function () {
    const currentAccountId = store('selected.current') as string

    if (currentAccountId) {
      const assets = fetchAssets(currentAccountId)

      if (!isScanning(currentAccountId) && (assets.erc20.length > 0 || assets.nativeCurrency.length > 0)) {
        if (!debouncedAssets) {
          setTimeout(() => {
            if (debouncedAssets) {
              handler.assetsChanged(currentAccountId, debouncedAssets)
              debouncedAssets = null
            }
          }, 800)
        }

        debouncedAssets = assets
      }
    }
  }
}

function loadAssets(accountId: string) {
  if (isScanning(accountId)) throw new Error('assets not known for account')

  return fetchAssets(accountId)
}

function fetchAssets(accountId: string) {
  const balances = storeApi.getBalances(accountId)

  const response = {
    nativeCurrency: [] as RPC.GetAssets.NativeCurrency[],
    erc20: [] as RPC.GetAssets.Erc20[]
  }

  return balances.reduce((assets, balance) => {
    if (balance.address === NATIVE_CURRENCY) {
      const currency = storeApi.getNativeCurrency(balance.chainId)

      assets.nativeCurrency.push({
        ...balance,
        currencyInfo: currency
      })
    } else {
      const usdRate = storeApi.getUsdRate(balance.address)

      assets.erc20.push({
        ...balance,
        tokenInfo: {
          lastKnownPrice: usdRate
        }
      })
    }

    return assets
  }, response)
}

function isScanning(account: Address) {
  const lastUpdated = storeApi.getLastUpdated(account)
  return !lastUpdated || new Date().getTime() - lastUpdated > 1000 * 60 * 5
}

export { loadAssets, createObserver }
