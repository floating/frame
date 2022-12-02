export interface TokensByChain {
  [chainId: number]: Token[]
}

export function groupByChain(grouped: TokensByChain, token: Token) {
  return {
    ...grouped,
    [token.chainId]: [...(grouped[token.chainId] || []), token]
  }
}
