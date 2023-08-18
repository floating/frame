import { utils } from 'ethers'
import { hexToInt } from '.'

import type { Chain } from '../../main/store/state/types'
import type { HexString } from '../../main/store/state/types/utils'

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
  return [10, 420, 8453, 84531, 7777777].includes(chainId)
}

export function calculateOptimismL1DataFee(serializedTx: string, baseFeeL1: HexString) {
  const FIXED_OVERHEAD = 188
  const DYNAMIC_OVERHEAD = 0.684

  const bytes = utils.arrayify(serializedTx)
  const baseFee = hexToInt(baseFeeL1) || 0

  // Compute the L1 data fee, with a cost of 16 per byte and 4 per empty byte,
  // starting at 1088 to account for a 68-byte signature
  const txDataFee = bytes.reduce((sum, byte) => sum + (byte === 0 ? 4 : 16), 1088)

  return baseFee * (txDataFee + FIXED_OVERHEAD) * DYNAMIC_OVERHEAD
}
