const { addHexPrefix } = require('ethereumjs-util')

jest.mock('../../../main/signers', () => jest.fn())
jest.mock('../../../main/windows', () => ({ broadcast: jest.fn(), showTray: jest.fn() }))
jest.mock('../../../main/externalData')
jest.mock('../../../main/nebula', () => jest.fn(() => ({
  ens: {
    lookupAddress: jest.fn()
  }
})))

const account = {
  "id": "0x22dd63c3619818fdbc262c78baee43cb61e9cccf",
  "name": "Seed Account",
  "lastSignerType": "seed",
  "address": "0x22dd63c3619818fdbc262c78baee43cb61e9cccf",
  "status": "ok",
  "signer": "3935336131653838663031303266613139373335616337626261373962343231",
  "requests": {},
  "ensName": null,
  "tokens": {},
  "created": "12819530:1626189153547"
}

const mockStore = {
  'main.accounts': {
    "0x22dd63c3619818fdbc262c78baee43cb61e9cccf": account
  }
}

jest.mock('../../../main/store', () => {
  const store = k => mockStore[k]

  store.updateAccount = () => {}
  store.observer = () => {}
  return store
})

let Accounts, request

beforeAll(async () => {
  // need to import this after mocks are set up
  Accounts = (await import('../../../main/accounts')).default
})

beforeEach(() => {
  request = {
    handlerId: 1,
    type: 'transaction',
    data: {
      gasLimit: '0x5208',
      type: '0x2',
      maxFeePerGas: addHexPrefix((10e9).toString(16))
    }
  }

  Accounts.setSigner('0x22dd63c3619818fdbc262c78baee43cb61e9cccf', jest.fn())
})

afterEach(() => {
  Object.values(Accounts.accounts).forEach(account => {
    Object.keys(account.requests).forEach(id => {
      Accounts.removeRequest(account, id)
    })
  })
})

it('loads the list of accounts', () => {
  const accounts = Accounts.list()

  expect(accounts).toHaveLength(1)
  expect(accounts[0].address).toBe('0x22dd63c3619818fdbc262c78baee43cb61e9cccf')
})

it('sets the account signer', () => {
  expect(Accounts.current().address).toBe('0x22dd63c3619818fdbc262c78baee43cb61e9cccf')
})

describe('#setGasLimit', () => {
  beforeEach(() => {
    Accounts.addRequest(request, jest.fn())
  })

  const setGasLimit = (limit, cb, requestId = 1, userUpdate = false) => Accounts.setGasLimit(limit, requestId, userUpdate, cb)

  it('does not set an undefined gas limit', done => {
    setGasLimit(undefined, err => {
      expect(err.message).toBe('Invalid gas limit')
      done()
    })
  })

  it('does not set an invalid gas limit', done => {
    setGasLimit(Number.NaN, err => {
      expect(err.message).toBe('Invalid gas limit')
      done()
    })
  })

  it('does not set a negative gas limit', done => {
    setGasLimit('-0x61a8', err => {
      expect(err.message).toBe('Invalid gas limit')
      done()
    })
  })

  it('does not set a gas limit if no account is active', done => {
    Accounts.unsetSigner(jest.fn())

    setGasLimit('0x61a8', err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('fails to find the request', done => {
    setGasLimit('0x61a8', err => {
      expect(err.message).toBeTruthy()
      done()
    }, 2)
  })

  it('does not set a gas limit on a non-transaction request', done => {
    request.type = 'message'

    setGasLimit('0x61a8', err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set a gas limit on a locked request', done => {
    request.locked = true

    setGasLimit('0x61a8', err => {
      expect(err.message).toBeTruthy()
      expect(Accounts.current().requests[1].data.gasLimit).toBe('0x5208')
      done()
    })
  })

  it('sets a valid gas limit', done => {
    setGasLimit('0x61a8', err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasLimit).toBe('0x61a8')
      done()
    })
  })

  it('does not set a gas limit on an automatic update if fees were manually set by the user', done => {
    request.feesUpdatedByUser = true

    setGasLimit('0x61a8', err => {
      expect(err.message).toBeTruthy()
      expect(Accounts.current().requests[1].data.gasLimit).toBe('0x5208')
      done()
    }, 1, false)
  })

  it('does not exceed the max fee for pre-EIP-1559 transactions', done => {
    const maxFee = 2e18 // 2 ETH
    const gasPrice = 400e9 // 400 gwei
    const maxLimit = maxFee / gasPrice
    const gasLimit = addHexPrefix((maxLimit + 1e5).toString(16)) // add 10000 to exceed the maximum limit

    request.data.type = '0x0'
    request.data.gasPrice = addHexPrefix(gasPrice.toString(16))

    setGasLimit(gasLimit, err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasLimit).toBe(addHexPrefix(maxLimit.toString(16)))
      done()
    })
  })

  it('does not exceed the max fee for post-EIP-1559 transactions', done => {
    const maxFee = 2e18 // 2 ETH
    const maxFeePerGas = 400e9 // 400 gwei
    const maxLimit = maxFee / maxFeePerGas
    const gasLimit = addHexPrefix((maxLimit + 1e5).toString(16)) // add 10000 to exceed the maximum limit

    request.data.type = '0x2'
    request.data.maxFeePerGas = addHexPrefix(maxFeePerGas.toString(16))

    setGasLimit(gasLimit, err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasLimit).toBe(addHexPrefix(maxLimit.toString(16)))
      done()
    })
  })

  it('caps the gas limit at 12.5e6', done => {
    const maxLimit = addHexPrefix((12.5e6).toString(16))
    const highLimit = addHexPrefix((13e6).toString(16))

    setGasLimit(highLimit, err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasLimit).toBe(maxLimit)
      done()
    })
  })

  it('updates the feesUpdatedByUser flag', done => {
    setGasLimit('0x61a8', err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].feesUpdatedByUser).toBe(true)
      done()
    }, 1, true)
  })
})
