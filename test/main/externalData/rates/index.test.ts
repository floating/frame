import BigNumber from 'bignumber.js'
import { mocked } from 'ts-jest/utils'

import loadRates from '../../../../main/externalData/rates'
import * as cg from '../../../../main/externalData/coingecko'

const coingecko = mocked(cg)

jest.mock('../../../../main/externalData/coingecko')
jest.useFakeTimers()

const platforms = [
  {
    id: 'ethereum',
    chain_identifier: '1',
    name: 'Ethereum',
    short_name: ''
  },
  {
    id: 'xdai',
    chain_identifier: '100',
    name: 'xDAI',
    short_name: ''
  }
]

const coins = [
  {
    id: 'honey',
    symbol: 'hny',
    name: 'Honey',
    asset_platform_id: 'xdai'
  }
]

const tokenPrices = {
  ethereum: {
    '0xd3c89cac4a4283edba6927e2910fd1ebc14fe006': new BigNumber(0.184269),
    '0xe41d2489571d322189246dafa5ebde1f4699f498': new BigNumber(0.797079)
  },
  xdai: {
    '0x71850b7e9ee3f13ab46d67167341e4bdc905eef9': new BigNumber(388.15),
    '0x1e16aa4df73d29c029d94ceda3e3114ec191e25a': new BigNumber(0.079163)
  }
}

beforeEach(() => {
  coingecko.listAssetPlatforms.mockResolvedValue(platforms)
  coingecko.listCoins.mockResolvedValue(coins)

  coingecko.tokenPrices.mockImplementation((addresses, platform) => {
    return Promise.resolve(
        addresses.reduce((allPrices, address) => {
          const price = (tokenPrices[platform] || {})[address]

          if (price) {
            return { ...allPrices, [address]: { usd: price } }
          }

          return allPrices
        }, {})
      )
    })
})

it('loads ethereum token rates for an unknown platform', async () => {
  const rates = await loadRates([
    '0xd3c89cac4a4283edba6927e2910fd1ebc14fe006',
    '0xe41d2489571d322189246dafa5ebde1f4699f498'
  ], 199)

  expect(Object.keys(rates)).toHaveLength(2)
  expect(rates['0xd3c89cac4a4283edba6927e2910fd1ebc14fe006'].usd.price.toNumber()).toBe(0.184269)
  expect(rates['0xe41d2489571d322189246dafa5ebde1f4699f498'].usd.price.toNumber()).toBe(0.797079)
})

it('loads token rates for a specific chain', async () => {
  const rates = await loadRates([
    '0x71850b7e9ee3f13ab46d67167341e4bdc905eef9',
    '0x1e16aa4df73d29c029d94ceda3e3114ec191e25a'
  ], 100)

  expect(Object.keys(rates)).toHaveLength(2)
  expect(rates['0x71850b7e9ee3f13ab46d67167341e4bdc905eef9'].usd.price.toNumber()).toBe(388.15)
  expect(rates['0x1e16aa4df73d29c029d94ceda3e3114ec191e25a'].usd.price.toNumber()).toBe(0.079163)
})

it('loads token rates with a mix of unknown and known tokens', async () => {
  const rates = await loadRates([
    '0x71850b7e9ee3f13ab46d67167341e4bdc905eef9',
    '0xd3c89cac4a4283edba6927e2910fd1ebc14fe006'
  ], 100)

  expect(Object.keys(rates)).toHaveLength(1)
  expect(rates['0x71850b7e9ee3f13ab46d67167341e4bdc905eef9'].usd.price.toNumber()).toBe(388.15)
  expect(rates['0xd3c89cac4a4283edba6927e2910fd1ebc14fe006']).not.toBeDefined()
})
