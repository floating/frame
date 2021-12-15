export interface TokensByChain {
  [chainId: number]: TokenDefinition[]
}

export function groupByChain (grouped: TokensByChain, token: TokenDefinition) {
  return {
    ...grouped,
    [token.chainId]: [...(grouped[token.chainId] || []), token]
  }
}
