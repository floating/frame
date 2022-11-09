import BigNumber from 'bignumber.js'
import { sortByTotalValue as byTotalValue } from '../../../../resources/domain/balance'

const mockBalance = (totalValue, balance, decimals = 0) => ({
  totalValue: BigNumber(totalValue),
  decimals,
  balance
})

describe('#sortByTotalValue', () => {
  it('should sort balances in descending order by total value', () => {
    const values = [10, 100, 60]
    const unsorted = values.map(mockBalance)

    const sortedValues = unsorted.sort(byTotalValue).map(b => b.totalValue.toNumber())

    expect(sortedValues).toStrictEqual([100, 60, 10])
  })
})
