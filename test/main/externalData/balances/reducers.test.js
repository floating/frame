import { groupByChain, mergeLists } from '../../../../main/externalData/balances/reducers'

describe('#mergeLists', () => {
  it('merges multiple lists into one list', () => {
    const merged = [[1, 2, 3], [4, 5, 6]].reduce(mergeLists, [])

    expect(merged).toEqual([1, 2, 3, 4, 5, 6])
  })
})
describe('#groupByChain', () => {
  it('groups tokens by chain', () => {
    const tokens = [
      { chainId: 1, symbol: 'OHM' },
      { chainId: 4, symbol: 'ZRX' },
      { chainId: 137, symbol: 'AAVE' },
      { chainId: 4, symbol: 'BADGER' },
      { chainId: 1, symbol: 'AUSDC' }
    ]

    const grouped = tokens.reduce(groupByChain, {})

    expect(grouped).toEqual({
      1: [{ chainId: 1, symbol: 'OHM' }, { chainId: 1, symbol: 'AUSDC' }],
      4: [{ chainId: 4, symbol: 'ZRX' }, { chainId: 4, symbol: 'BADGER' }],
      137: [{ chainId: 137, symbol: 'AAVE' }]
    })
  })
})

describe('#relevantBalances', () => {
  it('groups tokens by chain', () => {
    const tokens = [
      { chainId: 1, symbol: 'OHM' },
      { chainId: 4, symbol: 'ZRX' },
      { chainId: 137, symbol: 'AAVE' },
      { chainId: 4, symbol: 'BADGER' },
      { chainId: 1, symbol: 'AUSDC' }
    ]

    const grouped = tokens.reduce(groupByChain, {})

    expect(grouped).toEqual({
      1: [{ chainId: 1, symbol: 'OHM' }, { chainId: 1, symbol: 'AUSDC' }],
      4: [{ chainId: 4, symbol: 'ZRX' }, { chainId: 4, symbol: 'BADGER' }],
      137: [{ chainId: 137, symbol: 'AAVE' }]
    })
  })
})