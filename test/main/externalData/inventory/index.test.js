import loadInventory from '../../../../main/externalData/inventory'
import fetch from 'node-fetch'
import log from 'electron-log'

jest.mock('node-fetch')

const address = '0xc340c965a1277394b91a50e7c6eA57DEfbabcd91'

const asset = {
  asset_contract: {},
  collection: {
    slug: 'frames-super-cool-nfts'
  }
}

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

function parseQueryParams (uri) {
  const queryStr = uri.slice(uri.indexOf('?') + 1)
  return Object.fromEntries(queryStr.split(/[\?&]/).map(pair => pair.split('=')))
}

it('loads more than 50 inventory items', async () => {
  fetch.mockImplementationOnce(async (url, options) => {
    expect(options.method).toBe('GET')

    const uri = decodeURIComponent(url)
    expect(uri).toMatch(new RegExp(`^https://proxy.pylon.link`))

    const queryParams = parseQueryParams(uri)
    expect(queryParams.type).toBe('api')
    expect(queryParams.target).toMatch(new RegExp('https://api.opensea.io/api/v\\d/assets'))
    expect(queryParams.owner).toBe(address)
    expect(queryParams.cursor).toBeUndefined()

    const assets = Object.keys(Array(50).fill()).map(n => ({ ...asset, id: `frame-test-nft-${n}`}))
    return { status: 200, json: async () => ({ assets, next: 'acursor' })}
  })

  fetch.mockImplementationOnce(async (url, options) => {
    expect(options.method).toBe('GET')

    const uri = decodeURIComponent(url)
    expect(uri).toMatch(new RegExp(`^https://proxy.pylon.link`))

    const queryParams = parseQueryParams(uri)
    expect(queryParams.type).toBe('api')
    expect(queryParams.target).toMatch(new RegExp('https://api.opensea.io/api/v\\d/assets'))
    expect(queryParams.owner).toBe(address)
    expect(queryParams.cursor).toBe('acursor')

    const assets = Object.keys(Array(10).fill()).map(n => ({ ...asset, id: `frame-test-nft-${parseInt(n) + 50}`}))
    return { status: 200, json: async () => ({ assets, next: null })}
  })

  const result = await loadInventory(address)

  expect(result.success).toBe(true)
  expect(Object.keys(result.inventory['frames-super-cool-nfts'].assets)).toHaveLength(60)
})

it('returns an unsuccessful call to load inventory', async () => {
  fetch.mockResolvedValue({
    status: 401,
    json: async () => ({ assets: [{ ...asset, id: 'one-two'}] })
  })

  const result = await loadInventory(address)

  expect(result.success).toBe(false)
  expect(Object.keys(result.inventory)).toHaveLength(0)
})
