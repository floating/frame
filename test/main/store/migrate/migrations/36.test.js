import migrate from '../../../../../main/store/migrate/migrations/36'
import { createState } from '../setup'

let state

beforeEach(() => {
  state = createState()

  state.main.networks.ethereum = {
    100: {
      connection: {
        primary: { current: 'custom' },
        secondary: { current: 'local' }
      }
    }
  }
})

const connectionPriorities = ['primary', 'secondary']

connectionPriorities.forEach((priority) => {
  it(`updates a ${priority} Gnosis connection`, () => {
    state.main.networks.ethereum[100].connection[priority].current = 'poa'

    const updatedState = migrate(state)
    const gnosis = updatedState.main.networks.ethereum[100]

    expect(gnosis.connection[priority].current).toBe('custom')
    expect(gnosis.connection[priority].custom).toBe('https://rpc.gnosischain.com')
  })

  it(`does not update an existing custom ${priority} Gnosis connection`, () => {
    state.main.networks.ethereum[100].connection[priority].current = 'custom'
    state.main.networks.ethereum[100].connection[priority].custom = 'https://myconnection.io'

    const updatedState = migrate(state)
    const gnosis = updatedState.main.networks.ethereum[100]

    expect(gnosis.connection[priority].current).toBe('custom')
    expect(gnosis.connection[priority].custom).toBe('https://myconnection.io')
  })
})

it('takes no action if no Gnosis chain is present', () => {
  delete state.main.networks.ethereum[100]

  const updatedState = migrate(state)

  expect(updatedState.main.networks).toStrictEqual({ ethereum: {} })
})
