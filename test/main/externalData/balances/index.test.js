import { getTokenBalances } from '../../../../main/externalData/balances'
import tokenLoader from '../../../../main/externalData/inventory/tokens'
import multicall, { supportsChain } from '../../../../main/multicall'

import log from 'electron-log'
import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'

jest.mock('ethers', () => ({
  ethers: { Contract: jest.fn() },
  providers: { Web3Provider: jest.fn() }
}))

jest.mock('eth-provider', () => jest.fn(() => ({
  request: ({ method }) => {
    if (method === 'eth_chainId') return '0x1'
    throw new Error('unexpected eth call!')
  }
})))

jest.mock('../../../../main/externalData/inventory/tokens', () => ({ start: jest.fn(), getTokens: jest.fn(() => []) }))
jest.mock('../../../../main/multicall')

const ownerAddress = '0xbfa641051ba0a0ad1b0acf549a89536a0d76472e'

const aaveUsdcToken = {
  chainId: 1,
  address: '0xbcca60bb61934080951369a648fb03df4f96263c',
  symbol: 'aUSDC',
  decimals: 6
}

const zrxToken = {
  chainId: 1,
  address: '0xe41d2489571d322189246dafa5ebde1f4699f498',
  symbol: 'ZRX',
  decimals: 18
}

const olympusDaoToken = {
  chainId: 1,
  address: '0x383518188c0c6d7730d91b2c03a03c837814a899',
  symbol: 'OHM',
  decimals: 9
}

const badgerDaoToken = {
  chainId: 42161,
  address: '0xbfa641051ba0a0ad1b0acf549a89536a0d76472e',
  symbol: 'BADGER',
  decimals: 18
}

const knownTokens = [aaveUsdcToken, zrxToken, badgerDaoToken]

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

describe('#getTokenBalances', () => {
  let onChainBalances

  beforeEach(() => {
    onChainBalances = {
      [aaveUsdcToken.address]: new BigNumber('6245100000'),
      [zrxToken.address]: new BigNumber('756578458984500000000'),
      [olympusDaoToken.address]: new BigNumber('557830302000')
    }
  })

  describe('using multicall', () => {
    beforeEach(() => {
      supportsChain.mockReturnValue(true)

      multicall.mockImplementation(chainId => {
        expect(chainId).toBe(1)
  
        return {
          call: async function (tokenCalls) {
            const transformed = tokenCalls.reduce((results, tc) => {
              if (
                tc.call[0] === 'balanceOf(address)(uint256)' &&
                tc.call[1] === ownerAddress
              ) {
                results[tc.target] = tc.returns[0][1](onChainBalances[tc.target].toString())
              }
              
              return results
            }, {})
  
            return { transformed }
          }
        }
      })
    })

    afterEach(() => {
      multicall.mockReset()
    })
    
    it('loads all token balances for the current chain', async () => {
      tokenLoader.getTokens.mockReturnValue([olympusDaoToken])

      const tokenBalances = await getTokenBalances(ownerAddress, { knownTokens })

      expect(tokenBalances.chainId).toBe(1)
      expect(tokenBalances.balances).toStrictEqual({
        [olympusDaoToken.address]: {
          ...olympusDaoToken,
          balance: new BigNumber(557.830302)
        },
        [aaveUsdcToken.address]: {
          ...aaveUsdcToken,
          balance: new BigNumber(6245.1)
        },
        [zrxToken.address]: {
          ...zrxToken,
          balance: new BigNumber(756.5784589845)
        }
      })
    })

    it('loads only known token balances', async () => {
      tokenLoader.getTokens.mockReturnValue([olympusDaoToken])

      const tokenBalances = await getTokenBalances(ownerAddress, { knownTokens, onlyKnown: true })
      
      expect(Object.keys(tokenBalances.balances)).toHaveLength(2)
      expect(Object.keys(tokenBalances.balances)).not.toContain(olympusDaoToken.address)
    })

    it('allows a known token to take precedence over one from the list', async () => {
      const olderZrxToken = {
        ...zrxToken,
        decimals: 9
      }

      tokenLoader.getTokens.mockReturnValue([olderZrxToken])

      const tokenBalances = await getTokenBalances(ownerAddress, { knownTokens })

      expect(tokenBalances.balances[zrxToken.address].balance.toString()).toBe('756.5784589845')
    })
  })

  describe('using direct contract calls', () => {
    beforeEach(() => {
      ethers.Contract.mockImplementation(address => ({ balanceOf: async () => onChainBalances[address] }))
      
      supportsChain.mockReturnValue(false)
    })

    afterEach(() => {
      expect(multicall).not.toHaveBeenCalled()
    })
    
    it('loads token balances for the current chain', async () => {
      const tokenBalances = await getTokenBalances(ownerAddress, { knownTokens })

      expect(tokenBalances.chainId).toBe(1)
      expect(tokenBalances.balances).toStrictEqual({
        [aaveUsdcToken.address]: {
          ...aaveUsdcToken,
          balance: new BigNumber(6245.1)
        },
        [zrxToken.address]: {
          ...zrxToken,
          balance: new BigNumber(756.5784589845)
        }
      })
    })

    it('returns a zero balance that was previously known', async () => {
      onChainBalances[aaveUsdcToken.address] = new BigNumber(0)

      const tokenBalances = await getTokenBalances(ownerAddress, { knownTokens })

      expect(Object.keys(tokenBalances.balances)).toHaveLength(2)
      expect(tokenBalances.balances[aaveUsdcToken.address].balance.isZero()).toBe(true)
      expect(tokenBalances.balances[zrxToken.address].balance.toString()).toBe('756.5784589845')
    })
    
    it('returns a zero balance when the contract call fails', async () => {
      ethers.Contract.mockImplementation(() => ({ balanceOf: jest.fn().mockRejectedValue('unknown contract') }))
      const tokenBalances = await getTokenBalances(ownerAddress, { knownTokens })

      expect(tokenBalances.balances[aaveUsdcToken.address].balance.isZero()).toBe(true)
      expect(tokenBalances.balances[zrxToken.address].balance.isZero()).toBe(true)
    })
  })
})