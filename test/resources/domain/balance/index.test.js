import BigNumber from 'bignumber.js'
import { sortByTotalValue as byTotalValue } from '../../../../resources/domain/balance'


const makeMockBalance = (address, totalValue, balance, decimals = 0) => ({
  address,
  totalValue: BigNumber(totalValue),
  decimals,
  balance
})

const addresses = ["0xa7888f85bd76deef3bd03d4dbcf57765a49883b3", "0x66b870ddf78c975af5cd8edc6de25eca81791de1", "0xc1e42f862d202b4a0ed552c1145735ee088f6ccf", "0x9c5083dd4838e120dbeac44c052179692aa5dac5", "0x2326d4fb2737666dda96bd6314e3d4418246cfe8", "0xe70981f2aeb601a12001465c7a5e52aa76adcbec", "0xa1efa0adecb7f5691605899d13285928ae025844"]

describe('sortByTotalValue', () => {
  it('should correctly sort a set of balances in descending order by totalValue', () => {
    const bal1 =  makeMockBalance(addresses[0], 10, 1)
    const bal2 = makeMockBalance(addresses[1], 100, 1)
    const bal3 = makeMockBalance(addresses[2], 60, 100)
    const bal4 = makeMockBalance(addresses[3], 60, 300, 4)
    const bal5 = makeMockBalance(addresses[4], 60, 300)

    const unsorted = [bal5, bal2, bal1, bal4, bal3]
    const sorted = unsorted.sort(byTotalValue)

    expect(sorted).toStrictEqual([bal2, bal5, bal3, bal4, bal1])
  })
})
