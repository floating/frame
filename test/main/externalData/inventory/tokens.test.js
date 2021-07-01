/* globals jest it */

const mockNebula = {
  resolve: jest.fn().mockResolvedValue({ record: {} }),
  ipfs: {
    getJson: jest.fn().mockResolvedValue({
      tokens: [{ name: 'another-token', chainId: 299, address: '0x9999' }]
    })
  }
}

const tokenList = require('../../../../main/externalData/inventory/tokens')

jest.mock('../../../../main/nebula', () => jest.fn(() => mockNebula))

beforeAll(() => {
  tokenList.start()
})

afterAll(() => {
  tokenList.stop()
})

it('loads the included sushiswap token list', async () => {
  const tokens = await tokenList.getTokens(137)

  expect(tokens.length).toBe(52)
  expect(tokens[0].name).toBe('Aave')
})

it('loads a token list from nebula', async () => {
  const tokens = await tokenList.getTokens(299)

  expect(tokens.length).toBe(1)
  expect(tokens[0].name).toBe('another-token')
})

it('loads the default token list for mainnet', async () => {
  const tokens = await tokenList.getTokens(1)

  expect(tokens.length).toBeGreaterThan(0)
})

it('fails to load tokens for an unknown chain', async () => {
  const tokens = await tokenList.getTokens(-1)

  expect(tokens.length).toBe(0)
})
