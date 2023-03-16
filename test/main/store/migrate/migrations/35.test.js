import migration from '../../../../../main/store/migrate/migrations/35'
import { createState, initChainState } from '../setup'

const providers = ['infura', 'alchemy']

const migratedChains = [
  [1, 'Mainnet'],
  [3, 'Ropsten'],
  [4, 'Rinkeby'],
  [5, 'Goerli'],
  [10, 'Optimism'],
  [42, 'Kovan'],
  [137, 'Polygon'],
  [42161, 'Arbitrum'],
  [11155111, 'Sepolia']
]

let state

beforeEach(() => {
  state = createState(migration.version - 1)
})

it('should have migration version 35', () => {
  const { version } = migration
  expect(version).toBe(35)
})

migratedChains.forEach(([id, chainName]) => {
  providers.forEach((provider) => {
    it(`should remove the RPC for a primary ${chainName} ${provider} connection`, () => {
      initChainState(state, id)

      state.main.networks.ethereum[id].connection = {
        primary: { current: provider },
        secondary: { current: 'custom', custom: 'myrpc' }
      }

      const updatedState = migration.migrate(state)

      const {
        connection: { primary, secondary }
      } = updatedState.main.networks.ethereum[id]

      expect(primary.current).toBe('custom')
      expect(primary.custom).toBe('')
      expect(secondary.current).toBe('custom')
      expect(secondary.custom).toBe('myrpc')
    })

    it(`should remove the RPC for a secondary ${chainName} ${provider} connection`, () => {
      initChainState(state, id)

      state.main.networks.ethereum[id].connection = {
        primary: { current: 'local', on: true },
        secondary: { current: provider, on: false }
      }

      const updatedState = migration.migrate(state)

      const {
        connection: { primary, secondary }
      } = updatedState.main.networks.ethereum[id]

      expect(primary.current).toBe('local')
      expect(secondary.current).toBe('custom')
      expect(secondary.custom).toBe('')
    })
  })
})

it('should not migrate an existing custom infura connection on a Pylon chain', () => {
  initChainState(state, 10)

  state.main.networks.ethereum[10].connection = {
    primary: {
      current: 'custom',
      custom: 'https://optimism-mainnet.infura.io/v3/myapikey'
    },
    secondary: { current: 'custom' }
  }

  const updatedState = migration.migrate(state)

  const {
    connection: { primary, secondary }
  } = updatedState.main.networks.ethereum[10]

  expect(primary.current).toBe('custom')
  expect(primary.custom).toBe('https://optimism-mainnet.infura.io/v3/myapikey')
  expect(secondary.current).toBe('custom')
})

it('should show the migration warning if any Infura or Alchemy connections were updated', () => {
  initChainState(state, 1)

  state.main.networks.ethereum[1].connection = {
    primary: { current: 'infura', on: true },
    secondary: { current: 'custom', custom: 'myrpc', on: false }
  }

  const updatedState = migration.migrate(state)

  expect(updatedState.main.mute.migrateToPylon).toBe(false)
})

it('should not show the migration warning if the user has no Infura or Alchemy connections', () => {
  initChainState(state, 1)

  state.main.networks.ethereum[1].connection = {
    primary: { current: 'local', on: true },
    secondary: { current: 'custom', custom: 'myrpc', on: false }
  }

  const updatedState = migration.migrate(state)

  expect(updatedState.main.mute.migrateToPylon).toBe(true)
})

it('should remove an invalid chain from the state', () => {
  initChainState(state, 1)
  initChainState(state, 5)

  state.main.networks.ethereum[1].connection = {
    primary: { current: 'local', on: true },
    secondary: { current: 'custom', custom: 'myrpc', on: false }
  }

  // this chain has no connection information so it's invalid
  state.main.networks.ethereum[5].name = 'Goerli'

  const updatedState = migration.migrate(state)

  expect(Object.keys(updatedState.main.networks.ethereum)).toStrictEqual(['1'])
})

it('should keep a valid non-migrated chain in the state', () => {
  initChainState(state, 1)

  state.main.networks.ethereum[1].name = 'Mainnet'

  state.main.networks.ethereum[1].connection = {
    primary: { current: 'local', on: true },
    secondary: { current: 'custom', custom: 'myrpc', on: false }
  }

  const updatedState = migration.migrate(state)

  const mainnet = updatedState.main.networks.ethereum['1']
  expect(mainnet).toStrictEqual({
    name: 'Mainnet', // ensure this key, which is not relevant to the migration, is retained after parsing
    id: 1,
    connection: {
      primary: {
        current: 'local',
        custom: '',
        on: true
      },
      secondary: {
        current: 'custom',
        custom: 'myrpc',
        on: false
      }
    }
  })
})
