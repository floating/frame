import Account from '../../../../main/accounts/Account'
import reveal from '../../../../main/reveal'
import { fetchContract } from '../../../../main/contracts'

jest.mock('../../../../main/reveal')
jest.mock('../../../../main/contracts', () => { 
  const real = jest.requireActual('../../../../main/contracts')

  return {
    ...real,
    fetchContract: jest.fn()
  }
})

jest.mock('../../../../main/provider', () => ({ on: jest.fn() }))
jest.mock('../../../../main/accounts', () => ({ RequestMode: { Normal: 'normal' }}))
jest.mock('../../../../main/signers', () => ({}))
jest.mock('../../../../main/windows', () => ({}))
jest.mock('../../../../main/nebula', () => () => ({
  ready: jest.fn(),
  once: jest.fn(),
  ens: {
    reverseLookup: async () => ['frame.eth']
  }
}))

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
  fetchContract.mockResolvedValueOnce(undefined)
})

describe('#addRequest', () => {
  describe('recognizing requests', () => {
    it('recognizes an ERC-20 approval', done => {
      const request = {
        handlerId: '123456',
        type: 'transaction',
        data: {
          chainId: '0x539',
          to: '0x6887246668a3b87F54DeB3b94Ba47a6f63F32985',
          data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170'
        }
      }
      
      reveal.recog.mockResolvedValue([{
        id: 'erc20:approve'
      }])

      accounts.update.mockImplementationOnce(() => {})
      accounts.update.mockImplementationOnce(() => {
        expect(request.recognizedActions).toHaveLength(1)
        done()
      })

      account.addRequest(request)
    })
  })
})
