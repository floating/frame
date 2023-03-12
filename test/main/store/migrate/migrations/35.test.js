import migrate from '../../../../../main/store/migrate/migrations/35'
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
  state = createState()
})

migratedChains.forEach(([id, chainName]) => {
  providers.forEach((provider) => {
    it(`should remove the RPC for a primary ${chainName} ${provider} connection`, () => {
      initChainState(state, id)

      state.main.networks.ethereum[id].connection = {
        primary: { current: provider },
        secondary: { current: 'custom', custom: 'myrpc' }
      }

      const updatedState = migrate(state)

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

      const updatedState = migrate(state)

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

  const updatedState = migrate(state)

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

  const updatedState = migrate(state)

  expect(updatedState.main.mute.migrateToPylon).toBe(false)
})

it('should not show the migration warning if the user has no Infura or Alchemy connections', () => {
  initChainState(state, 1)

  state.main.networks.ethereum[1].connection = {
    primary: { current: 'local', on: true },
    secondary: { current: 'custom', custom: 'myrpc', on: false }
  }

  const updatedState = migrate(state)

  expect(updatedState.main.mute.migrateToPylon).toBe(true)
})
