import loadStaticData from '../../../../main/externalData/staticData'
import coingecko from '../../../../main/externalData/coingecko'

jest.mock('../../../../main/externalData/coingecko')

beforeEach(() => {
  coingecko.__clearCustomCoins()
})

it('loads symbol data for known coins', async () => {
  const data = await loadStaticData(['xdai', 'matic'])

  expect(data.xdai.name).toBe('xDAI')
  expect(data.xdai.icon).toBeTruthy()
  expect(data.matic.name).toBe('Polygon')
  expect(data.matic.icon).toBeTruthy()
})

it('loads default symbol data for unknown coins', async () => {
  const data = await loadStaticData(['frame'])

  expect(data.frame.name).toBe('FRAME')
  expect(data.frame.usd.price).toBe(0)
  expect(data.frame.usd.change24hr).toBe(0)
})

it('loads symbol data for Ether', async () => {
  const data = await loadStaticData(['eth'])

  expect(data.eth.name).toBe('Ether')
})

it('loads current price data', async () => {
  const data = await loadStaticData(['matic'])

  expect(Math.abs(data.matic.usd.price)).toBeGreaterThan(0)
  expect(Math.abs(data.matic.usd.change24hr)).toBeGreaterThan(0)
})

it('loads the coin with the highest market cap', async () => {
  // if there are 2 coins with the same symbol, use the one with the highest market cap

  coingecko.__addCoin({
    id: 'matic-wannabe',
    symbol: 'matic',
    name: 'AutoMatic',
    image: 'http://image.com',
    market_cap: 2300
  })

  const data = await loadStaticData(['matic'])

  expect(data.matic.name).toBe('Polygon')
})
