import loadInventory from '../../../../main/externalData/inventory'
import fetch from 'node-fetch'
import log from 'electron-log'

jest.mock('node-fetch')

const address = '0xc340c965a1277394b91a50e7c6eA57DEfbabcd91'

const collection = {
  slug: 'test-nfts'
}

const asset = {
  id: 'frame-test-nft-1',
  asset_contract: {},
  collection
}

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})


it('loads more than 50 inventory items', async () => {
  fetch.mockImplementationOnce(async (url, options) => {
    expect(options.method).toBe('GET')

    const uri = decodeURIComponent(url)
    expect(uri).toMatch(new RegExp(`owner=${address}`))

    const assets = Object.keys(Array(50).fill()).map(n => ({ ...asset, id: `frame-test-nft-${n}`}))
    return { status: 200, json: async () => ({ assets, next: 'acursor' })}
  })

  fetch.mockImplementationOnce(async (url, options) => {
    expect(options.method).toBe('GET')

    const uri = decodeURIComponent(url)
    expect(uri).toMatch(new RegExp(`owner=${address}`))
    expect(uri).toMatch(new RegExp(`cursor=acursor`))

    const assets = Object.keys(Array(10).fill()).map(n => ({ ...asset, id: `frame-test-nft-${parseInt(n) + 50}`}))
    return { status: 200, json: async () => ({ assets, next: null })}
  })

  const result = await loadInventory(address)

  expect(result.success).toBe(true)
  expect(Object.keys(result.inventory['test-nfts'].assets)).toHaveLength(60)
})