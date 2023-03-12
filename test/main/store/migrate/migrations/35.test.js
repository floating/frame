import migrate from '../../../../../main/store/migrate/migrations/35'
import { createState, initChainState } from '../setup'

const providers = ['infura', 'alchemy']

const pylonChains = [
  [1, 'Mainnet'],
  [5, 'Goerli'],
  [10, 'Optimism'],
  [137, 'Polygon'],
  [42161, 'Arbitrum'],
  [11155111, 'Sepolia']
]

let state

beforeEach(() => {
  state = createState()
})

pylonChains.forEach(([id, chainName]) => {
  providers.forEach((provider) => {
    it(`should migrate a primary ${chainName} ${provider} connection to use Pylon`, () => {
      initChainState(state, id)
      state.main.networks.ethereum[id].connection = {
        primary: { current: provider, on: true, connected: false },
        secondary: { current: 'custom', on: false, connected: false }
      }

      const updatedState = migrate(state)

      const {
        connection: { primary, secondary }
      } = updatedState.main.networks.ethereum[id]

      expect(primary.current).toBe('pylon')
      expect(secondary.current).toBe('custom')
    })

    it(`should migrate a secondary ${chainName} ${provider} connection to use Pylon`, () => {
      initChainState(state, id)
      state.main.networks.ethereum[id].connection = {
        primary: { current: 'local', on: true, connected: false },
        secondary: { current: provider, on: false, connected: false }
      }

      const updatedState = migrate(state)

      const {
        connection: { primary, secondary }
      } = updatedState.main.networks.ethereum[id]

      expect(primary.current).toBe('local')
      expect(secondary.current).toBe('pylon')
    })
  })
})

// these chains will not be supported by Pylon
const retiredChains = [
  [3, 'Ropsten'],
  [4, 'Rinkeby'],
  [42, 'Kovan']
]

retiredChains.forEach(([id, chainName]) => {
  providers.forEach((provider) => {
    it(`should remove a primary ${chainName} ${provider} connection`, () => {
      initChainState(state, id)
      state.main.networks.ethereum[id].connection = {
        primary: { current: provider, on: true, connected: false },
        secondary: { current: 'custom', on: false, connected: false }
      }

      const updatedState = migrate(state)

      const {
        connection: { primary }
      } = updatedState.main.networks.ethereum[id]

      expect(primary.current).toBe('custom')
      expect(primary.on).toBe(false)
    })

    it(`should remove a secondary ${chainName} ${provider} connection`, () => {
      initChainState(state, id)
      state.main.networks.ethereum[id].connection = {
        primary: { current: 'local', on: true, connected: false },
        secondary: { current: provider, on: false, connected: false }
      }

      const updatedState = migrate(state)

      const {
        connection: { secondary }
      } = updatedState.main.networks.ethereum[id]

      expect(secondary.current).toBe('custom')
      expect(secondary.on).toBe(false)
    })
  })
})

it('should not migrate an existing custom infura connection on a Pylon chain', () => {
  initChainState(state, 10)
  state.main.networks.ethereum[10].connection = {
    primary: {
      current: 'custom',
      custom: 'https://optimism-mainnet.infura.io/v3/myapikey',
      on: true,
      connected: false
    },
    secondary: { current: 'custom', on: false, connected: false }
  }

  const updatedState = migrate(state)

  const {
    connection: { primary, secondary }
  } = updatedState.main.networks.ethereum[10]

  expect(primary.current).toBe('custom')
  expect(primary.on).toBe(true)
  expect(primary.custom).toBe('https://optimism-mainnet.infura.io/v3/myapikey')
  expect(secondary.current).toBe('custom')
})
