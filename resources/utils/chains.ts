import { utils } from 'ethers'

import type { Chain } from '../../main/store/state'

export function isNetworkConnected(network: Chain) {
  return (
    network &&
    ((network.connection.primary && network.connection.primary.connected) ||
      (network.connection.secondary && network.connection.secondary.connected))
  )
}

export function isNetworkEnabled(network: Chain) {
  return network.on
}

export function chainUsesEth(chainId: number) {
  return [1, 3, 4, 5, 10, 42, 42161, 11155111].includes(chainId)
}

export function chainUsesOptimismFees(chainId: number) {
  return [10, 420, 8453, 84531].includes(chainId)
}

export function optimismL1DataFee(searlizedTx: string, baseFeeL1: number) {
  if (!searlizedTx || !baseFeeL1) return 0

  const FIXED_OVERHEAD = 188
  const DYNAMIC_OVERHEAD = 0.684

  const bytes = utils.arrayify(searlizedTx)

  // Count zero and non-zero bytes
  let zeroBytesCount = 0
  let nonZeroBytesCount = 68 // pad non-zero bytes to account for signature

  for (let byte of bytes) {
    if (byte === 0) {
      zeroBytesCount++
    } else {
      nonZeroBytesCount++
    }
  }

  // Compute the L1 data fee
  const txData = zeroBytesCount * 4 + nonZeroBytesCount * 16
  return baseFeeL1 * (txData + FIXED_OVERHEAD) * DYNAMIC_OVERHEAD
}
