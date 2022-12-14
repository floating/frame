import { accountSort as byCreation } from '../../../../resources/domain/account'

const makeMockAccount = (address, timestamp = Date.now(), block = 0, name = address) => ({
  address,
  name,
  created: block ? `${block}:${timestamp}` : `new:${timestamp}`
})

const addresses = [
  '0xa7888f85bd76deef3bd03d4dbcf57765a49883b3',
  '0x66b870ddf78c975af5cd8edc6de25eca81791de1',
  '0xc1e42f862d202b4a0ed552c1145735ee088f6ccf',
  '0x9c5083dd4838e120dbeac44c052179692aa5dac5',
  '0x2326d4fb2737666dda96bd6314e3d4418246cfe8',
  '0xe70981f2aeb601a12001465c7a5e52aa76adcbec',
  '0xa1efa0adecb7f5691605899d13285928ae025844'
]
let now = 0

beforeEach(() => {
  now = Date.now()
})

describe('accountSort', () => {
  it('should correctly sort a set of accounts in descending order by creation time according to timestamp', () => {
    const acc1 = makeMockAccount(addresses[0])
    const acc2 = makeMockAccount(addresses[1], now + 500)
    const acc3 = makeMockAccount(addresses[2], now + 800)
    const acc4 = makeMockAccount(addresses[3], now + 2000)

    const unsorted = [acc2, acc3, acc1, acc4]
    const sorted = unsorted.sort(byCreation)

    expect(sorted).toStrictEqual([acc4, acc3, acc2, acc1])
  })

  it('should correctly sort a set of accounts in descending order by creation time according to block number', () => {
    const acc1 = makeMockAccount(addresses[0], now, 10)
    const acc2 = makeMockAccount(addresses[1], now, 20)
    const acc3 = makeMockAccount(addresses[2], now, 21)
    const acc4 = makeMockAccount(addresses[3], now, 30)

    const unsorted = [acc2, acc4, acc3, acc1]
    const sorted = unsorted.sort(byCreation)

    expect(sorted).toStrictEqual([acc4, acc3, acc2, acc1])
  })

  it('should correctly sort a set of accounts in descending order by creation time according to block number and timestamp', () => {
    const acc1 = makeMockAccount(addresses[0], now)
    const acc2 = makeMockAccount(addresses[1], now, 20)
    const acc3 = makeMockAccount(addresses[2], now + 800, 999)
    const acc4 = makeMockAccount(addresses[3], now + 100, 31)

    const unsorted = [acc2, acc3, acc1, acc4]
    const sorted = unsorted.sort(byCreation)

    expect(sorted).toStrictEqual([acc1, acc3, acc4, acc2])
  })
})
