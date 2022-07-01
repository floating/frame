import TokenLoader from '../../../../main/externalData/inventory/tokens'
import log from 'electron-log'

jest.mock('eth-provider', () => () => ({ connected: true }))

jest.mock('../../../../main/nebula', () =>
  jest.fn(() => ({
    resolve: async () => ({ record: {} }),
    ipfs: {
      getJson: async () => ({
        tokens: [{ name: 'another-token', chainId: 299, address: '0x9999' }],
      }),
    },
  }))
)

beforeAll(() => {
  log.transports.console.level = false
  jest.useFakeTimers()
})

afterAll(() => {
  log.transports.console.level = 'debug'
  jest.useRealTimers()
})

let tokenLoader

beforeEach(() => {
  tokenLoader = new TokenLoader()
})

afterEach(() => {
  tokenLoader.stop()
})

it('loads the included sushiswap token list', () => {
  const tokens = tokenLoader.getTokens(137)

  expect(tokens.length).toBeGreaterThan(50)
  expect(tokens[0].name).toBe('Aave')
})

it('loads a token list from nebula', async () => {
  await tokenLoader.start()

  const tokens = tokenLoader.getTokens(299)

  expect(tokens.length).toBe(1)
  expect(tokens[0].name).toBe('another-token')
})

it('loads the default token list for mainnet', () => {
  const tokens = tokenLoader.getTokens(1)

  expect(tokens.length).toBeGreaterThan(0)
})

it('fails to load tokens for an unknown chain', () => {
  const tokens = tokenLoader.getTokens(-1)

  expect(tokens.length).toBe(0)
})
