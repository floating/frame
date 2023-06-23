import log from 'electron-log'
import Pylon, { AssetType } from '@framelabs/pylon-client'

import { handleUpdates } from './store'
import { storeApi } from '../storeApi'
import { Token } from '../../store/state'
import { toTokenId } from '../../../resources/domain/balance'

import type { AssetId } from '@framelabs/pylon-client/dist/assetId'

function toTokenSubscriptions(
  { tokenSubscriptions, tokenIds }: { tokenSubscriptions: AssetId[]; tokenIds: Set<string> },
  address: Address
) {
  const addToken = (token: Token) => {
    const { chainId, address } = token
    const tokenId = toTokenId({ chainId, address })

    if (!tokenIds.has(tokenId)) {
      tokenIds.add(tokenId)
      tokenSubscriptions.push({
        type: AssetType.Token,
        chainId,
        address
      })
    }
  }

  storeApi.getTokenBalances(address).forEach(addToken)

  return { tokenSubscriptions, tokenIds }
}

export default function rates(pylon: Pylon) {
  function updateSubscription() {
    const networks = storeApi.getNetworks()
    const addresses = storeApi.getAddresses()

    const nativeSubscriptions = networks.map(({ id: chainId }) => ({
      type: AssetType.NativeCurrency,
      chainId
    }))

    const { tokenSubscriptions } = addresses.reduce(toTokenSubscriptions, {
      tokenSubscriptions: [] as AssetId[],
      tokenIds: new Set<string>()
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
