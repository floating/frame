const { addHexPrefix } = require('ethereumjs-util')

jest.mock('../../../main/signers', () => jest.fn())
jest.mock('../../../main/windows', () => ({ broadcast: jest.fn(), showTray: jest.fn() }))
jest.mock('../../../main/externalData')
jest.mock('../../../main/nebula', () => jest.fn(() => ({
  ens: {
    lookupAddress: jest.fn()
  }
})))

const weiToHex = wei => addHexPrefix(wei.toString(16))
const gweiToHex = gwei => weiToHex(gwei * 1e9)

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
      maxPriorityFeePerGas: gweiToHex(1),
      maxFeePerGas: gweiToHex(9)
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

describe('#setBaseFee', () => {
  beforeEach(() => {
    Accounts.addRequest(request, jest.fn())
  })

  const setBaseFee = (baseFee, cb, requestId = 1, userUpdate = false) => Accounts.setBaseFee(baseFee, requestId, userUpdate, cb)

  it('does not set an undefined base fee', done => {
    setBaseFee(undefined, err => {
      expect(err.message).toBe('Invalid base fee')
      done()
    })
  })

  it('does not set an invalid base fee', done => {
    setBaseFee('wrong', err => {
      expect(err.message).toBe('Invalid base fee')
      done()
    })
  })

  it('does not set a negative base fee', done => {
    setBaseFee('-0x12a05f200', err => {
      expect(err.message).toBe('Invalid base fee')
      done()
    })
  })

  it('does not set a base fee if no account is active', done => {
    Accounts.unsetSigner(jest.fn())

    setBaseFee('0x1dcd65000', err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('fails to find the request', done => {
    setBaseFee('0x1dcd65000', err => {
      expect(err.message).toBeTruthy()
      done()
    }, 2)
  })

  it('does not set a base fee on a non-transaction request', done => {
    request.type = 'message'

    setBaseFee('0x1dcd65000', err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set a base fee on a locked request', done => {
    request.locked = true

    setBaseFee('0x1dcd65000', err => {
      expect(err.message).toBeTruthy()
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(request.data.maxFeePerGas)
      done()
    })
  })

  it('does not set a base fee on an automatic update if fees were manually set by the user', done => {
    request.feesUpdatedByUser = true

    setBaseFee('0x1dcd65000', err => {
      expect(err.message).toBeTruthy()
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(request.data.maxFeePerGas)
      done()
    }, 1, false)
  })


  it('sets a valid base fee', done => {
    const baseFee = 6e9 // 6 gwei
    const expectedMaxFee = weiToHex(baseFee + parseInt(request.data.maxPriorityFeePerGas))

    setBaseFee(weiToHex(baseFee), err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
      done()
    })
  })

  it('caps the base fee at 9999 gwei', done => {
    const highBaseFee = gweiToHex(10200)
    const maxBaseFee = 9999e9
    const expectedMaxFee = weiToHex(maxBaseFee + parseInt(request.data.maxPriorityFeePerGas))

    setBaseFee(highBaseFee, err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
      done()
    })
  })

  it('does not exceed the max allowable fee', done => {
    const maxTotal = 2e18 // 2 ETH
    const gasLimit = 1e7
    const maxFee = maxTotal / gasLimit
    const highBaseFee = weiToHex(maxFee + 10e9) // add 10 gwei to exceed the maximum limit

    request.data.gasLimit = weiToHex(gasLimit)

    setBaseFee(highBaseFee, err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(weiToHex(maxFee))
      done()
    })
  })

  it('updates the feesUpdatedByUser flag', done => {
    setBaseFee('0x1dcd65000', err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].feesUpdatedByUser).toBe(true)
      done()
    }, 1, true)
  })
})

describe('#setPriorityFee', () => {
  beforeEach(() => {
    Accounts.addRequest(request, jest.fn())
  })

  const setPriorityFee = (fee, cb, requestId = 1, userUpdate = false) => Accounts.setPriorityFee(fee, requestId, userUpdate, cb)

  it('does not set an undefined priority fee', done => {
    setPriorityFee(undefined, err => {
      expect(err.message).toBe('Invalid priority fee')
      done()
    })
  })

  it('does not set an invalid priority fee', done => {
    setPriorityFee('incorrect', err => {
      expect(err.message).toBe('Invalid priority fee')
      done()
    })
  })

  it('does not set a negative priority fee', done => {
    setPriorityFee('-0x12a05f200', err => {
      expect(err.message).toBe('Invalid priority fee')
      done()
    })
  })

  it('does not set a priority fee if no account is active', done => {
    Accounts.unsetSigner(jest.fn())

    setPriorityFee('0x12a05f200', err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('fails to find the request', done => {
    setPriorityFee('0x12a05f200', err => {
      expect(err.message).toBeTruthy()
      done()
    }, 2)
  })

  it('does not set a priority fee on a non-transaction request', done => {
    request.type = 'message'

    setPriorityFee('0x12a05f200', err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set a priority fee on a locked request', done => {
    request.locked = true

    setPriorityFee('0x12a05f200', err => {
      expect(err.message).toBeTruthy()
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(request.data.maxFeePerGas)
      done()
    })
  })

  it('does not set a priority fee on an automatic update if fees were manually set by the user', done => {
    request.feesUpdatedByUser = true

    setPriorityFee('0x12a05f200', err => {
      expect(err.message).toBeTruthy()
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(request.data.maxFeePerGas)
      done()
    }, 1, false)
  })


  it('sets a valid priority fee', done => {
    const priorityFee = 2e9 // 2 gwei
    const priorityFeeChange = priorityFee - parseInt(request.data.maxPriorityFeePerGas)
    const expectedMaxFee = weiToHex(priorityFeeChange + parseInt(request.data.maxFeePerGas))

    setPriorityFee(weiToHex(priorityFee), err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(weiToHex(priorityFee))
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
      done()
    })
  })

  it('caps the priority fee at 9999 gwei', done => {
    const highPriorityFee = gweiToHex(10200)
    const maxPriorityFee = 9999e9
    const priorityFeeChange = maxPriorityFee - parseInt(request.data.maxPriorityFeePerGas)
    const expectedMaxFee = weiToHex(priorityFeeChange + parseInt(request.data.maxFeePerGas))

    setPriorityFee(highPriorityFee, err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(weiToHex(maxPriorityFee))
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
      done()
    })
  })

  it('does not exceed the max allowable fee', done => {
    const maxTotal = 2e18 // 2 ETH
    const gasLimit = 1e7
    const maxFee = maxTotal / gasLimit

    request.data.gasLimit = weiToHex(gasLimit)
    request.data.maxFeePerGas = gweiToHex(190)
    request.data.maxPriorityFeePerGas = gweiToHex(40)

    const highPriorityFee = 60e9 // add 20 gwei to the above to exceed the maximum limit
    const expectedPriorityFee = maxFee - (parseInt(request.data.maxFeePerGas) - parseInt(request.data.maxPriorityFeePerGas))

    setPriorityFee(highPriorityFee, err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(weiToHex(expectedPriorityFee))
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(weiToHex(maxFee))
      done()
    })
  })

  it('updates the feesUpdatedByUser flag', done => {
    setPriorityFee('0x12a05f200', err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].feesUpdatedByUser).toBe(true)
      done()
    }, 1, true)
  })
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
      expect(Accounts.current().requests[1].data.gasLimit).toBe(request.data.gasLimit)
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
      expect(Accounts.current().requests[1].data.gasLimit).toBe(request.data.gasLimit)
      done()
    }, 1, false)
  })

  it('does not exceed the max fee for pre-EIP-1559 transactions', done => {
    const maxFee = 2e18 // 2 ETH
    const gasPrice = 400e9 // 400 gwei
    const maxLimit = maxFee / gasPrice
    const gasLimit = weiToHex(maxLimit + 1e5) // add 10000 to exceed the maximum limit

    request.data.type = '0x0'
    request.data.gasPrice = weiToHex(gasPrice)

    setGasLimit(gasLimit, err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasLimit).toBe(weiToHex(maxLimit))
      done()
    })
  })

  it('does not exceed the max fee for post-EIP-1559 transactions', done => {
    const maxFee = 2e18 // 2 ETH
    const maxFeePerGas = 400e9 // 400 gwei
    const maxLimit = maxFee / maxFeePerGas
    const gasLimit = weiToHex(maxLimit + 1e5) // add 10000 to exceed the maximum limit

    request.data.type = '0x2'
    request.data.maxFeePerGas = weiToHex(maxFeePerGas)

    setGasLimit(gasLimit, err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasLimit).toBe(weiToHex(maxLimit))
      done()
    })
  })

  it('caps the gas limit at 12.5e6', done => {
    const maxLimit = weiToHex(12.5e6)
    const highLimit = weiToHex(13e6)

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
