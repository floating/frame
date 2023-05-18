import log from 'electron-log'
import Pylon, { AssetType } from '@framelabs/pylon-client'

import { handleUpdates } from './store'
import store from '../../store'
import { toTokenId } from '../../../resources/domain/balance'

import type { AssetId } from '@framelabs/pylon-client/dist/assetId'
import type { Token } from '../../store/state'

const storeApi = {
  getKnownTokens: (address?: Address) => ((address && store('main.tokens.known', address)) || []) as Token[],
  getAddresses: () => Object.keys(store('main.accounts')),
  getCustomTokens: () => (store('main.tokens.custom') || []) as Token[]
}

export default function rates(pylon: Pylon) {
  function updateSubscription(chains: number[]) {
    const subscribedCurrencies = chains.map((chainId) => ({ type: AssetType.NativeCurrency, chainId }))

    const addresses = storeApi.getAddresses()

    const knownTokens = addresses.reduce((allTokens, address) => {
      const tokens = storeApi.getKnownTokens(address).filter((token) => chains.includes(token.chainId))

      return [...allTokens, ...tokens]
    }, [] as Token[])

    const customTokens = storeApi.getCustomTokens().filter((token) => chains.includes(token.chainId))

    const tokens = new Set([...knownTokens, ...customTokens].map(toTokenId))

    const subscribedTokens = Array.from(tokens).map((token) => {
      const [chainId, address] = token.split(':')
      return {
        type: AssetType.Token,
        chainId: Number(chainId),
        address: address
      }
    })

    subscribeToRates([...subscribedCurrencies, ...subscribedTokens])
  }

  function start() {
    log.verbose('starting rates updates')

    pylon.on('rates', handleUpdates)
  }

  function stop() {
    log.verbose('stopping rates updates')

    pylon.off('rates', handleUpdates)

    pylon.rates([])
  }

  function subscribeToRates(assetIds: AssetId[]) {
    log.debug(
      'subscribing to rates updates for native currencies on chains:',
      assetIds.filter((a) => a.type === AssetType.NativeCurrency).map((a) => a.chainId)
    )

    log.debug(
      'subscribing to rates updates for tokens:',
      assetIds.filter((a) => a.type === AssetType.Token).map((a) => a.address)
    )

    pylon.rates(assetIds)
  }

  return {
    start,
    stop,
    subscribeToRates,
    updateSubscription
  }
}
