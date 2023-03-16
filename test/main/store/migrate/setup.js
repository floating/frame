export const createState = () => ({
  main: {
    _version: 0,
    networks: { ethereum: {} },
    networksMeta: { ethereum: {} },
    accounts: {},
    balances: {},
    mute: {},
    tokens: { known: {} }
  }
})

export const initChainState = (state, chainId) => {
  state.main.networks.ethereum[chainId] = { id: chainId }
  state.main.networksMeta.ethereum[chainId] = { nativeCurrency: {} }
}
