import migration from '../../../../../main/store/migrate/migrations/42'
import { createState } from '../setup'

it('adds both Rootstock networks with their RPC and currency metadata', () => {
  const state = createState(41)
  const updated = migration.migrate(state)

  expect(updated.main.networks.ethereum[30]).toMatchObject({
    id: 30,
    name: 'Rootstock',
    isTestnet: false,
    on: false,
    connection: { primary: { current: 'custom', custom: 'https://public-node.rsk.co' } }
  })
  expect(updated.main.networks.ethereum[31]).toMatchObject({
    id: 31,
    name: 'Rootstock Testnet',
    isTestnet: true,
    on: false,
    connection: { primary: { current: 'custom', custom: 'https://public-node.testnet.rsk.co' } }
  })
  expect(updated.main.networksMeta.ethereum[30].nativeCurrency.symbol).toBe('RBTC')
  expect(updated.main.networksMeta.ethereum[31].nativeCurrency.symbol).toBe('tRBTC')
})

it('preserves Rootstock networks already configured by the user', () => {
  const state = createState(41)
  const custom = { id: 30, name: 'My Rootstock', connection: {
    primary: { current: 'custom', custom: 'https://my-rpc.example' },
    secondary: { current: 'custom', custom: '' }
  } }
  state.main.networks.ethereum[30] = custom
  state.main.networksMeta.ethereum[30] = { nativeCurrency: { symbol: 'RBTC' } }

  const updated = migration.migrate(state)

  expect(updated.main.networks.ethereum[30].name).toBe('My Rootstock')
  expect(updated.main.networks.ethereum[30].connection.primary.custom).toBe('https://my-rpc.example')
  expect(updated.main.networks.ethereum[31].name).toBe('Rootstock Testnet')
})
