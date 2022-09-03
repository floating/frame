import { arraysMatch } from '../../../resources/utils'
import store from '../../store'

// typed access to state
const storeApi = {
  getCurrentOrigins: (): Record<string, Origin> => {
    return store('main.origins')
  },
  getChains: (): Record<string, Network> => {
    return store('main.networks.ethereum') || {}
  }
}

interface ChainsChangedHandler {
  chainsChanged: (chainIds: number[]) => void
}

interface ChainChangedHandler {
  chainChanged: (chainId: number, originId: string) => void
}

interface NetworkChangedHandler {
  networkChanged: (networkId: number, originId: string) => void
}

function createChainsObserver (handler: ChainsChangedHandler) {
  let availableChains = getActiveChains()

  return function () {
    const currentChains = getActiveChains()

    if (!arraysMatch(currentChains, availableChains)) {
      availableChains = currentChains
      handler.chainsChanged(availableChains)
    }
  }
}

function createOriginChainObserver (handler: ChainChangedHandler & NetworkChangedHandler) {
  let knownOrigins: Record<string, Origin> = {}

  return function () {
    const currentOrigins = storeApi.getCurrentOrigins()

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

function getActiveChains () {
  const chains = storeApi.getChains()
  
  return Object.values(chains)
    .filter(chain => chain.on)
    .map(chain => chain.id)
    .sort((a, b) => a - b)
}

export { getActiveChains, createChainsObserver, createOriginChainObserver }
