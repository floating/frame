import log from 'electron-log'

import Pylon, { AssetType } from '@framelabs/pylon-client'

import type { AssetId } from '@framelabs/pylon-client/dist/assetId'
import type { Token } from '../../store/state'
import { toTokenId } from '../../../resources/domain/balance'
import getRatesManager from './manager'

export default function rates(pylon: Pylon, store: Store) {
  const ratesManager = getRatesManager(store)

  const storeApi = {
    getKnownTokens: (address?: Address) =>
      ((address && store('main.tokens.known', address)) || []) as Token[],
    getAddresses: () => Object.keys(store('main.accounts')),
    getCustomTokens: () => (store('main.tokens.custom') || []) as Token[]
  }

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

    setAssets([...subscribedCurrencies, ...subscribedTokens])
  }

  function start() {
    log.verbose('starting asset updates')

    pylon.on('rates', ratesManager.handleUpdates)
  }

  function stop() {
    log.verbose('stopping asset updates')

    pylon.off('rates', ratesManager.handleUpdates)

    pylon.rates([])
  }

  function setAssets(assetIds: AssetId[]) {
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
    setAssets,
    updateSubscription
  }
}
