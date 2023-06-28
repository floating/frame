export function getMaxTotalFee(tx = { chainId: '' }) {
  const chainId = parseInt(tx.chainId)

  // for ETH-based chains, the max fee should be 2 ETH
  if ([1, 3, 4, 5, 6, 10, 42, 61, 62, 63, 69, 42161, 421611].includes(chainId)) {
    return 2 * 1e18
  }

  // for Fantom, the max fee should be 14000 FTM
  if ([250, 4002].includes(chainId)) {
    return 14_000 * 1e18
  }

  // for PulseChain, the max fee should be 10M PLS
  if ([369, 940, 941, 942, 943].includes(chainId)) {
    return 10_000_000 * 1e18
  }

  // for all other chains, default to 500 of the chain's currency
  return 500 * 1e18
}
