import log from 'electron-log'
import Pylon, { AssetType } from '@framelabs/pylon-client'

import { handleUpdates } from './store'
import { storeApi } from '../storeApi'
import { toTokenId } from '../../../resources/domain/balance'

import type { AssetId } from '@framelabs/pylon-client/dist/assetId'
import type { Chain, Token, UsdRate, WithTokenId } from '../../store/state'

const EMPTY_RATE_STATE = {}
const POPULATE_EMPTY_STATE_TIMEOUT = 2000 // 2 seconds

const tokenSubscriptionSet = {
  tokenSubscriptions: [] as AssetId[],
  tokenIds: new Set<string>()
}

const toTokenSubscriptions = (
  { tokenSubscriptions, tokenIds }: typeof tokenSubscriptionSet,
  address: Address
) => {
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

const toNativeSubscription = ({ id: chainId }: Chain) => ({
  type: AssetType.NativeCurrency,
  chainId
})

const populateWithEmptyState = (assets: AssetId[]) => () => {
  const persistedRates = storeApi.getTokenRates()
  const defaultedRates = assets.reduce((rates, asset) => {
    const tokenId = toTokenId(asset as WithTokenId)
    if (!persistedRates[tokenId]) {
      rates[tokenId] = EMPTY_RATE_STATE
    }
    return rates
  }, {} as Record<string, UsdRate>)

  storeApi.setTokenRates(defaultedRates)
}

export default function rates(pylon: Pylon) {
  function updateSubscription() {
    const networks = storeApi.getNetworks()
    const addresses = storeApi.getAddresses()

    const nativeSubscriptions = networks.map(toNativeSubscription)
    const { tokenSubscriptions } = addresses.reduce(toTokenSubscriptions, tokenSubscriptionSet)

    subscribeToRates([...nativeSubscriptions, ...tokenSubscriptions])
    setTimeout(populateWithEmptyState(tokenSubscriptions), POPULATE_EMPTY_STATE_TIMEOUT)
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
