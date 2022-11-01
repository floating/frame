import Account from '../../../../main/accounts/Account'
import { identity, decode } from '../../../../main/reveal'

jest.mock('../../../../main/reveal')
jest.mock('../../../../main/provider', () => ({ on: jest.fn() }))
jest.mock('../../../../main/accounts', () => ({ RequestMode: { Normal: 'normal' }}))
jest.mock('../../../../main/signers', () => ({}))
jest.mock('../../../../main/windows', () => ({}))
jest.mock('../../../../main/nebula', () => () => ({ ready: jest.fn(), once: jest.fn() }))

jest.mock('../../../../main/windows/nav', () => ({
  forward: jest.fn()
}))

jest.mock('../../../../main/store', () => {
  const store = jest.fn()
  store.setPermission = jest.fn()
  store.setSignerView = jest.fn()
  store.setPanelView = jest.fn()
  store.observer = jest.fn()
  return store
})

let account

const accounts = { update: jest.fn() }

const accountState = {
  address: '0x690B9A9E9aa1C9dB991C7721a92d351Db4FaC990',
  name: 'Test Account'
}

beforeEach(() => {
  account = new Account(accountState, accounts)
})

describe('#addRequest', () => {
  describe('decoding requests', () => {
    it('decodes an ERC-20 approval', async () => {
      const request = {
        handlerId: '123456',
        type: 'transaction',
        data: {
          to: '0x6887246668a3b87F54DeB3b94Ba47a6f63F32985'
        }
      }

      account.addRequest(request)
    })
  })
})
