import { jest } from '@jest/globals'
import { randomBytes, randomInt } from 'crypto'

import { handleBalanceUpdate } from '../../../../../main/externalData/balances/processor'
import { storeApi } from '../../../../../main/externalData/storeApi'
import { NATIVE_CURRENCY } from '../../../../../resources/constants'

const randomStr = () => randomBytes(32).toString('hex')

jest.mock('../../../../../main/externalData/surface', () => ({}))
const { getTokenBalances, getCustomTokens, getNativeCurrency, addKnownTokens, getKnownTokens } =
  jest.mocked(storeApi)

jest.mock('../../../../../main/externalData/storeApi', () => ({
  storeApi: {
    getTokenBalances: jest.fn(() => []),
    getCustomTokens: jest.fn(() => []),
    getNativeCurrency: jest.fn(),
    getKnownTokens: jest.fn(() => []),
    addPopulatedChains: jest.fn(),
    setBalances: jest.fn(),
    addKnownTokens: jest.fn(),
    accountTokensUpdated: jest.fn(),
    setAccountTokensUpdated: jest.fn()
  }
}))

const Balance = (
  chainId = 1,
  address = randomStr(),
  balanceString = '0x' + randomInt(20000000).toString(16)
) =>
  ({
    symbol: randomStr(),
    name: randomStr(),
    decimals: randomInt(18),
    address,
    chainId,
    balance: balanceString,
    displayBalance: '',
    media: {
      source: '',
      cdn: {},
      format: ''
    }
  } as const)

const Token = (address: string, chainId: number, symbol = randomStr(), name = randomStr()) =>
  ({
    symbol,
    name,
    decimals: randomInt(18),
    address,
    chainId,
    media: {
      source: '',
      cdn: {},
      format: ''
    }
  } as const)

describe('updating balance expiry times', () => {
  it('should set the correct expiry time for snapshot balance updates', () => {
    const address = randomStr()
    const chains = [1, 2, 3]
    handleBalanceUpdate(address, [], chains, 'snapshot')
    expect(storeApi.addPopulatedChains).toHaveBeenCalledWith(address, chains, 1000 * 60 * 5)
  })

  it('should set the correct expiry time for scan balance updates', () => {
    const address = randomStr()
    const chains = [1, 2, 3]
    handleBalanceUpdate(address, [], chains, 'scan')
    expect(storeApi.addPopulatedChains).toHaveBeenCalledWith(address, chains, 1000 * 60)
  })
})

describe('updating balances', () => {
  it('should update the state with the new balances', () => {
    const address = randomStr()
    const balances = [Balance(), Balance()]
    handleBalanceUpdate(address, balances, [], 'snapshot')
    expect(storeApi.setBalances).toHaveBeenCalledWith(address, balances)
  })

  it('should use custom token data where available', () => {
    const address = randomStr()
    const balances = [Balance(), Balance()]

    const { address: bal1Addr, chainId: bal1Chain } = balances[0]

    const customTokens = [Token(bal1Addr, bal1Chain)]

    getCustomTokens.mockImplementationOnce(() => customTokens)

    handleBalanceUpdate(address, balances, [1], 'snapshot')

    expect(storeApi.setBalances).toHaveBeenCalledWith(address, [
      {
        ...balances[0],
        ...customTokens[0]
      },
      balances[1]
    ])
  })

  it('should use the native token data where available', () => {
    const address = randomStr()
    const balances = [Balance(1, NATIVE_CURRENCY)]

    const nativeCurrency = {
      symbol: 'ETH',
      name: 'Ethereum',
      chainId: 1,
      address: NATIVE_CURRENCY,
      decimals: 18,
      icon: 'https://cdn.mycryptoapi.com/images/ETH_icon.png',
      usd: {
        price: 1000,
        change24hr: 0
      },
      media: {
        source: '',
        cdn: {},
        format: ''
      },
      balance: '0x00',
      displayBalance: '0'
    } as const

    // getCustomTokens.mockImplementationOnce(() => [])
    getNativeCurrency.mockReturnValueOnce(nativeCurrency)

    handleBalanceUpdate(address, balances, [1], 'snapshot')
    const { symbol, decimals, name, media } = nativeCurrency
    const expectedBalance = { ...balances[0], symbol, decimals, name, address: NATIVE_CURRENCY, media }

    expect(storeApi.setBalances).toHaveBeenCalledWith(address, [expectedBalance])
  })

  it('should include all custom tokens', () => {
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

    expect(storeApi.setBalances).toHaveBeenCalledWith(address, [...balances, customTokenBalance])
  })

  it('should not update balances which have not changed', () => {
    const address = randomStr()
    const balances = [Balance(), Balance()]

    getTokenBalances.mockImplementationOnce(() => balances)

    handleBalanceUpdate(address, balances, [], 'snapshot')

    expect(storeApi.setBalances).not.toHaveBeenCalled()
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

    expect(storeApi.setBalances).toHaveBeenCalledWith(address, [newBalance])
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

    expect(storeApi.setBalances).toHaveBeenCalledWith(address, [newBalance])
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

    expect(storeApi.setBalances).toHaveBeenCalledWith(address, [newBalance])
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

    expect(storeApi.setBalances).not.toHaveBeenCalled()
  })
})

describe('updating tokens', () => {
  it('should add previously unknown tokens to the known tokens', () => {
    const address = randomStr()
    const balance = Balance()

    handleBalanceUpdate(address, [balance], [balance.chainId], 'snapshot')
    expect(storeApi.addKnownTokens).toHaveBeenCalledWith(address, [balance])
  })
  it('should not add previously known tokens to the known tokens', () => {
    const address = randomStr()
    const balance = Balance()
    getKnownTokens.mockReturnValueOnce([balance])
    handleBalanceUpdate(address, [balance], [balance.chainId], 'snapshot')
    expect(storeApi.addKnownTokens).not.toHaveBeenCalled()
  })

  it('should not add native assets to the known tokens', () => {
    const address = randomStr()
    const balance = Balance(1, NATIVE_CURRENCY)
    handleBalanceUpdate(address, [balance], [balance.chainId], 'snapshot')
    expect(storeApi.addKnownTokens).not.toHaveBeenCalled()
  })
})
