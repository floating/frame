import migration from '../../../../../main/store/migrate/migrations/39'
import { createState, initChainState } from '../setup'

let state

beforeEach(() => {
  state = createState(migration.version - 1)

  initChainState(state, 100, 'Gnosis')

  state.main.networks.ethereum[100].connection = {
    primary: { current: 'custom', custom: 'myrpc' },
    secondary: { current: 'local', custom: '' }
  }
})

it('should have migration version 39', () => {
  const { version } = migration
  expect(version).toBe(39)
})

const connectionPriorities = ['primary', 'secondary']

connectionPriorities.forEach((priority) => {
  it(`updates a ${priority} Gnosis connection`, () => {
    state.main.networks.ethereum[100].connection[priority].current = 'poa'

    const updatedState = migration.migrate(state)
    const gnosis = updatedState.main.networks.ethereum[100]

    expect(gnosis.connection[priority].current).toBe('custom')
    expect(gnosis.connection[priority].custom).toBe('https://rpc.gnosischain.com')
  })

  it(`does not update an existing custom ${priority} Gnosis connection`, () => {
    state.main.networks.ethereum[100].connection[priority].current = 'custom'
    state.main.networks.ethereum[100].connection[priority].custom = 'https://myconnection.io'

    const updatedState = migration.migrate(state)
    const gnosis = updatedState.main.networks.ethereum[100]

    expect(gnosis.connection[priority].current).toBe('custom')
    expect(gnosis.connection[priority].custom).toBe('https://myconnection.io')
  })
})

it('takes no action if no Gnosis chain is present', () => {
  delete state.main.networks.ethereum[100]

  const updatedState = migration.migrate(state)

  expect(updatedState.main.networks).toStrictEqual({ ethereum: {} })
})
