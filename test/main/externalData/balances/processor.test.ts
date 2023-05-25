import { jest } from '@jest/globals'
import { randomBytes, randomInt } from 'crypto'

import store from '../../../../main/store'
import { handleBalanceUpdate } from '../../../../main/externalData/balances/processor'
import { storeApi } from '../../../../main/externalData/balances/storeApi'

const randomStr = () => randomBytes(32).toString('hex')

jest.mock('../../../../main/externalData/surface', () => ({}))
jest.mock('../../../../main/store', () => ({
  removeKnownTokens: jest.fn(),
  addKnownTokens: jest.fn(),
  setBalances: jest.fn(),
  accountTokensUpdated: jest.fn(),
  addPopulatedChains: jest.fn()
}))

const { getTokenBalances, getCustomTokens } = jest.mocked(storeApi)

jest.mock('../../../../main/externalData/balances/storeApi', () => ({
  storeApi: {
    getTokenBalances: jest.fn(() => []),
    getCustomTokens: jest.fn(() => []),
    getKnownTokens: () => []
  }
}))

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})

const Balance = (
  chainId = 1,
  address = randomStr(),
  balanceString = '0x' + randomInt(20000000).toString(16)
) => ({
  symbol: randomStr(),
  name: randomStr(),
  decimals: randomInt(18),
  address,
  chainId,
  balance: balanceString,
  displayBalance: ''
})

const Token = (address: string, chainId: number, symbol = randomStr(), name = randomStr()) => ({
  symbol,
  name,
  decimals: randomInt(18),
  address,
  chainId
})

describe('snapshot updates', () => {
  it('should always mark any present chains as populated in the state with the correct expiry time', () => {
    const address = randomStr()
    const chains = [1, 2, 3]
    handleBalanceUpdate(address, [], chains, 'snapshot')
    expect(store.addPopulatedChains).toHaveBeenCalledWith(address, chains, 1000 * 60 * 5)
  })

  it('should update the state with the new balances', () => {
    const address = randomStr()
    const balances = [Balance(), Balance()]
    handleBalanceUpdate(address, balances, [], 'snapshot')
    expect(store.setBalances).toHaveBeenCalledWith(address, balances)
  })

  it('should use custom token data where available', () => {
    const address = randomStr()
    const balances = [Balance(), Balance()]

    const { address: bal1Addr, chainId: bal1Chain } = balances[0]

    const customTokens = [Token(bal1Addr, bal1Chain)]

    getCustomTokens.mockImplementationOnce(() => customTokens)

    handleBalanceUpdate(address, balances, [1], 'snapshot')

    expect(store.setBalances).toHaveBeenCalledWith(address, [
      {
        ...balances[0],
        ...customTokens[0]
      },
      balances[1]
    ])
  })

  it('should include all custom tokens in the balances', () => {
    const address = randomStr()
    const balances = [Balance(), Balance()]

    const customToken = Token(randomStr(), 1)

    const customTokenBalance = {
      ...customToken,
      balance: '0x00',
      displayBalance: '0'
    }

    getCustomTokens.mockImplementationOnce(() => [customToken])

    handleBalanceUpdate(address, balances, [1], 'snapshot')

    expect(store.setBalances).toHaveBeenCalledWith(address, [...balances, customTokenBalance])
  })

  it('should not update balances which have not changed', () => {
    const address = randomStr()
    const balances = [Balance(), Balance()]

    getTokenBalances.mockImplementationOnce(() => balances)

    handleBalanceUpdate(address, balances, [], 'snapshot')

    expect(store.setBalances).not.toHaveBeenCalled()
  })

  it('should update the balances where the amount has changed', () => {
    const address = randomStr()
    const balances = [Balance(), Balance()]

    getTokenBalances.mockImplementationOnce(() => balances)

    const newBalance = {
      ...balances[0],
      balance: '0x' + randomInt(20000000).toString(16)
    }

    handleBalanceUpdate(address, [newBalance], [], 'snapshot')

    expect(store.setBalances).toHaveBeenCalledWith(address, [newBalance])
  })

  it('should update the balances where the amount has changed and its a custom token', () => {
    const address = randomStr()
    const balances = [Balance(), Balance()]
    getTokenBalances.mockImplementationOnce(() => balances)

    const newBalance = {
      ...balances[0],
      balance: '0x' + randomInt(20000000).toString(16)
    }

    handleBalanceUpdate(address, [newBalance], [], 'snapshot')

    expect(store.setBalances).toHaveBeenCalledWith(address, [newBalance])
  })

  it('should update the balances where the metadata have changed and its not a custom token', () => {
    const address = randomStr()
    const balances = [Balance(), Balance()]

    getTokenBalances.mockImplementationOnce(() => balances)

    const newBalance = {
      ...balances[0],
      logoUri: randomStr()
    }

    handleBalanceUpdate(address, [newBalance], [], 'snapshot')

    expect(store.setBalances).toHaveBeenCalledWith(address, [newBalance])
  })

  it('should not update the balances where the metadata has changed but the token is custom', () => {
    const address = randomStr()

    const customToken = Token(randomStr(), 1)

    const customTokenBalance = {
      ...customToken,
      balance: '0x00',
      displayBalance: '0'
    }

    const balances = [Balance(), customTokenBalance]

    getCustomTokens.mockImplementation(() => [customToken])
    getTokenBalances.mockImplementationOnce(() => balances)

    const newBalance = {
      ...customTokenBalance,
      logoUri: randomStr()
    }

    handleBalanceUpdate(address, [newBalance], [], 'snapshot')

    expect(store.setBalances).not.toHaveBeenCalled()
  })
})

// describe('scanner updates', () => {
//   it('should update the state with the new balances', () => {})
//   it('should mark any present chains as populated in the state with the correct expiry time', () => {})
//   it('should use custom token data where available', () => {})
//   it('should use native asset data where available', () => {})
//   it('should include all custom tokens in the balances', () => {})
// })

// describe('custom token updates', () => {
//   it('should ignore updates for chains using the accounts service', () => {})
//   it('should ', () => {})
// })
