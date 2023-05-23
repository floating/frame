import { randomBytes, randomInt } from 'crypto'
import { handleBalanceUpdate } from '../../../../main/externalData/balances/processor'
import store from '../../../../main/store'
import { storeApi } from '../../../../main/externalData/balances/storeApi'
import { Token as IToken } from '../../../../main/store/state'
const randomStr = () => randomBytes(32).toString('hex')

jest.mock('../../../../main/externalData/surface', () => ({}))
jest.mock('../../../../main/store', () => ({
  removeKnownTokens: jest.fn(),
  addKnownTokens: jest.fn(),
  setBalances: jest.fn(),
  accountTokensUpdated: jest.fn(),
  addPopulatedChains: jest.fn()
}))

jest.mock('../../../../main/externalData/balances/storeApi', () => ({
  storeApi: {
    getTokenBalances: jest.fn(() => []),
    getCustomTokens: jest.fn(() => []),
    getKnownTokens: jest.fn(() => [])
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

const Token = (address: string, chainId: number, symbol = randomStr(), name = randomStr()): IToken => ({
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

    ;(storeApi.getCustomTokens as jest.Mock).mockImplementation(() => customTokens)

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

    ;(storeApi.getCustomTokens as jest.Mock).mockImplementation(() => [customToken])

    handleBalanceUpdate(address, balances, [1], 'snapshot')

    expect(store.setBalances).toHaveBeenCalledWith(address, [...balances, customTokenBalance])
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
