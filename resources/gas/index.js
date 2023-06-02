import { BigNumber } from 'bignumber.js'

// returns the max total fee of a chain in units of the native currency
export function getMaxTotalFee(store, chainId, chainType = 'ethereum') {
  // no max total fee for testnets
  const { isTestnet } = store('main.networks', chainType, chainId)
  if (isTestnet) {
    return undefined
  }

  const { maxTotalFee = 0, maxTotalFeeExpiry = 0 } = store('main.networksMeta', chainType, chainId)
  const nowDateTime = Date.now()
  const feeExpired = nowDateTime > maxTotalFeeExpiry
  const { nativeCurrency } = store('main.networksMeta', chainType, chainId)
  const nativeUSD = nativeCurrency?.usd?.price

  // return the stored value if it has not expired or if there is no USD price to calculate a new one
  if (!feeExpired || (feeExpired && !nativeUSD)) {
    return BigNumber(maxTotalFee)
  }

  // re-calculate max total fee based on the current USD price
  const maxFeeUSD = 5000
  const maxTotalFeeBN = BigNumber(maxFeeUSD / nativeUSD).times(1e18)

  // store new max total fee for this chain, recalculate after a week
  const timeToExpire = 7 * 24 * 60 * 60 * 1000
  store.setMaxTotalFee(chainType, chainId, maxTotalFeeBN.toString(), nowDateTime + timeToExpire)

  // return new max total fee
  return maxTotalFeeBN
}
