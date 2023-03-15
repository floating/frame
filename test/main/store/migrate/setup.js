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

export const runMigration = (migration, state) => {
  const { validate, migrate } = migration.generateMigration(state)
  const initial = validate()
  return initial ? migrate(initial) : state
}
