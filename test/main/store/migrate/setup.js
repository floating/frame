export const createState = (version = 0) => ({
  main: {
    _version: version,
    networks: { ethereum: {} },
    networksMeta: { ethereum: {} },
    accounts: {},
    balances: {},
    mute: {},
    shortcuts: {},
    tokens: { known: {}, custom: [] }
  }
})

export const initChainState = (state, chainId, name = 'Mainnet') => {
  state.main.networks.ethereum[chainId] = { id: chainId, type: 'ethereum', name }
  state.main.networksMeta.ethereum[chainId] = { nativeCurrency: {} }
}
