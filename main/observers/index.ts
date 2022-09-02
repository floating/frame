import { arraysMatch } from '../../resources/utils'
import { getActiveChains, isScanning, loadAssets } from '../provider/helpers'

interface ChainsChangedHandler {
  chainsChanged: (chainIds: number[]) => void
}

interface ChainChangedHandler {
  chainChanged: (chainId: number, originId: string) => void
}

interface NetworkChangedHandler {
  networkChanged: (networkId: number, originId: string) => void
}

interface AssetsChangedHandler {
  assetsChanged: (address: Address, assets: RPC.GetAssets.Assets) => void
}

export function ChainsChangeObserver (handler: ChainsChangedHandler) {
  let availableChains = getActiveChains()

  return function () {
    const currentChains = getActiveChains()

    if (!arraysMatch(currentChains, availableChains)) {
      availableChains = currentChains
      handler.chainsChanged(availableChains)
    }
  }
}

export function OriginChainChangeObserver (handler: ChainChangedHandler & NetworkChangedHandler, store: Store) {
  let knownOrigins: Record<string, Origin> = {}

  return function () {
    const currentOrigins = store('main.origins') as Record<string, Origin>

    for (const originId in currentOrigins) {
      const currentOrigin = currentOrigins[originId]
      const knownOrigin = knownOrigins[originId]

      if (knownOrigin && knownOrigin.chain.id !== currentOrigin.chain.id) {
        handler.chainChanged(currentOrigin.chain.id, originId)
        handler.networkChanged(currentOrigin.chain.id, originId)
      }

      knownOrigins[originId] = currentOrigin
    }
  }
}

export function AssetsChangedObserver (handler: AssetsChangedHandler, store: Store) {
  let debouncedAssets: RPC.GetAssets.Assets | null = null

  return function () {
    const currentAccountId = store('selected.current')

    if (currentAccountId) {
      const assets = loadAssets(currentAccountId)

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
