import { utils } from 'ethers'
import { hexToInt } from '.'

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

export function chainUsesOptimismFees(chainId: number) {
  return [10, 420, 8453, 84531, 84532, 7777777, 11155420].includes(chainId)
}
