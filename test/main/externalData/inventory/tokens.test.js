/* globals jest */


const mockNebula = {
  resolve: jest.fn(),
  ipfs: {
    getJson: jest.fn()
  }
}

const tokenList = require('../../../../main/externalData/inventory/tokens')
const nebula = require('../../../../main/nebula')
const fetch = require('node-fetch')

jest.mock('node-fetch')
jest.mock('../../../../main/nebula', () => jest.fn(() => mockNebula))

beforeAll(() => {
  fetch.mockImplementation(url => {
    if (url.endsWith('matic.json')) {
      return Promise.resolve({
        json: () => { return Promise.resolve([{ name: 'atoken', chainId: 137, address: '0x9999' }]) }
      })
    }

    return Promise.reject('unknown token list!')
  })
})

it('loads a token list from sushiswap', async () => {
  const tokens = await tokenList(137)

  expect(tokens.length).toBe(1)
  expect(tokens[0].name).toBe('atoken')
})

it('loads a token list from nebula', async () => {
  mockNebula.resolve.mockResolvedValue({ record: {} })
  mockNebula.ipfs.getJson.mockResolvedValue([{ name: 'another-token', chainId: 100, address: '0x9999' }])

  const tokens = await tokenList(100)

  expect(tokens.length).toBe(1)
  expect(tokens[0].name).toBe('another-token')
})

it('loads the default token list for mainnet', async () => {
  const tokens = await tokenList(1)

  expect(tokens.length).toBeGreaterThan(0)
})

it('fails to load tokens for an unknown chain', async () => {
  const tokens = await tokenList(-1)

  expect(tokens.length).toBe(0)
})
