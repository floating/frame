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
  return [10, 420, 8453, 84531, 84532, 7777777, 11155420].includes(chainId)
}
