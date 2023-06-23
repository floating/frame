import log from 'electron-log'
import Pylon, { AssetType } from '@framelabs/pylon-client'

import { handleUpdates } from './store'
import { toTokenId } from '../../../resources/domain/balance'

import type { AssetId } from '@framelabs/pylon-client/dist/assetId'
import type { Token } from '../../store/state'
import { storeApi } from '../storeApi'

export default function rates(pylon: Pylon) {
  function updateSubscription() {
    const networks = storeApi.getNetworks()
    const addresses = storeApi.getAddresses()

    const nativeSubscriptions = networks.map(({ id: chainId }) => ({
      type: AssetType.NativeCurrency,
      chainId
    }))

    const displayedTokens = addresses.reduce((allTokens, address) => {
      const tokens = storeApi.getTokenBalances(address)
      return [...allTokens, ...tokens]
    }, [] as Token[])

    const tokens = new Set(displayedTokens.map(toTokenId))

    const tokenSubscriptions = Array.from(tokens).map((token) => {
      const [chainId, address] = token.split(':')
      return {
        type: AssetType.Token,
        chainId: Number(chainId),
        address: address
      }
    })

    subscribeToRates([...nativeSubscriptions, ...tokenSubscriptions])
  }

  function start() {
    log.verbose('Starting rates updates')

    pylon.on('rates', handleUpdates)
  }

  function stop() {
    log.verbose('Stopping rates updates')

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
