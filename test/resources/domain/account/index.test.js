import { accountSort } from '../../../../resources/domain/account'

const blockNumber  = Math.floor(Math.random() * 10000)
const accountFilter = (newOnly = true) => ({created}) => newOnly ? created.startsWith("new") : !created.startsWith("new")
const addresses = ["0xa7888f85bd76deef3bd03d4dbcf57765a49883b3", "0x66b870ddf78c975af5cd8edc6de25eca81791de1", "0xc1e42f862d202b4a0ed552c1145735ee088f6ccf", "0x9c5083dd4838e120dbeac44c052179692aa5dac5", "0x2326d4fb2737666dda96bd6314e3d4418246cfe8", "0xe70981f2aeb601a12001465c7a5e52aa76adcbec", "0xa1efa0adecb7f5691605899d13285928ae025844"]
const accountsObj = addresses.reduce((acc, address, index) => (Object.assign(acc, {[address]:{
  address,
  name: address,
  created: index % 2 === 0 ? `${blockNumber + index}:${Date.now()}` : `new:${Date.now() + (index * 10)}`,
}})
), {})
let accounts = Object.values(accountsObj)

beforeEach(() => {
  //shuffle accounts
  accounts = accounts.sort(() => 0.5 - Math.random());
})

describe('accountSort', () => {
  it('should correctly sort a set of accounts in descending order by creation time when `creation` properties have the "new" prefix', () => {
    const newAccounts = accounts.filter(accountFilter())
    const newAccountAddresses = newAccounts.map(acc => acc.address)
    const sorted = newAccountAddresses.sort((a,b) => accountSort(accountsObj, a, b))
    const orderedAddresses = addresses.filter(x => newAccountAddresses.includes(x)).reverse();
    expect(sorted).toStrictEqual(orderedAddresses)
  })

  it('should correctly sort a set of accounts in descending order by creation time when `creation` properties have a numeric block prefix', () => {
    const blockAccounts = accounts.filter(accountFilter(false))
    const blockAccountAddresses = blockAccounts.map(acc => acc.address)
    const sorted = blockAccountAddresses.sort((a,b) => accountSort(accountsObj, a, b))
    const orderedAddresses = addresses.filter(x => blockAccountAddresses.includes(x)).reverse();
    expect(sorted).toStrictEqual(orderedAddresses)
  })

  it('should correctly sort a set of accounts in descending order by creation time when `creation` properties have both prefixes', () => {
    const accountAddresses = accounts.map(acc => acc.address)
    const sorted = accountAddresses.sort((a,b) => accountSort(accountsObj, a, b))
    const newAccountAddresses = accounts.filter(accountFilter()).map(x => x.address)
    const orderedNewAddresses = addresses.filter(x => newAccountAddresses.includes(x)).reverse();
    const orderedBlockAddresses = addresses.filter(x => !newAccountAddresses.includes(x)).reverse();
    expect(sorted).toStrictEqual([...orderedNewAddresses, ...orderedBlockAddresses])
  })
})
