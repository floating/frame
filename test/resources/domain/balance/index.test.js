import { BigNumber } from 'bignumber.js'
import { sortByTotalValue as byTotalValue, createBalance } from '../../../../resources/domain/balance'

describe('#createBalance', () => {
  it('creates a balance with an unknown price when no quote is available', () => {
    const quote = undefined
    const balance = createBalance({ balance: '0x2ed3afa800', decimals: 18 }, quote)

    expect(balance.price).toBe('?')
  })

  it('creates a balance with no price change data when no quote is available', () => {
    const quote = undefined
    const balance = createBalance({ balance: '0x2ed3afa800', decimals: 18 }, quote)

    expect(balance.priceChange).toBeFalsy()
  })

  it('creates a balance with zero total value when no quote is available', () => {
    const quote = undefined
    const balance = createBalance({ balance: '0x2ed3afa800', decimals: 18 }, quote)

    expect(balance.totalValue.toNumber()).toBe(0)
  })

  it('creates a balance with an unknown display value when no quote is available', () => {
    const quote = undefined
    const balance = createBalance({ balance: '0x2ed3afa800', decimals: 18 }, quote)

    expect(balance.displayValue).toBe('?')
  })
})

describe('#sortByTotalValue', () => {
  const mockBalance = (totalValue, balance = 0, decimals = 0) => ({
    totalValue: BigNumber(totalValue),
    decimals,
    balance
  })

  it('should sort balances in descending order by total value', () => {
    const values = [10, 100, 60]
    const unsorted = values.map(mockBalance)

    const sortedValues = unsorted.sort(byTotalValue).map((b) => b.totalValue.toNumber())

    expect(sortedValues).toStrictEqual([100, 60, 10])
  })

  it('should sort balances in descending order by balance', () => {
    const values = [10, 100, 60]
    const unsorted = values.map((value) => mockBalance(10, value))

    const sortedValues = unsorted.sort(byTotalValue).map((b) => b.balance)

    expect(sortedValues).toStrictEqual([100, 60, 10])
  })

  it('should sort balances in descending order by totalValue and balance', () => {
    const bal1 = mockBalance(10, 20)
    const bal2 = mockBalance(100, 990)
    const bal3 = mockBalance(0, 1000)
    const bal4 = mockBalance(100, 989)

    const unsorted = [bal1, bal2, bal3, bal4]
    const sortedValues = unsorted.sort(byTotalValue)

    expect(sortedValues).toStrictEqual([bal2, bal4, bal1, bal3])
  })
})
