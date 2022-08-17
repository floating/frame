import log from 'electron-log'
import { addHexPrefix } from 'ethereumjs-util'
import store from '../../../main/store'
import provider from '../../../main/provider'

jest.mock('../../../main/provider', () => ({ send: jest.fn(), emit: jest.fn() }))
jest.mock('../../../main/signers', () => ({ get: jest.fn() }))
jest.mock('../../../main/windows', () => ({ broadcast: jest.fn(), showTray: jest.fn() }))
jest.mock('../../../main/windows/nav', () => ({ on: jest.fn(), forward: jest.fn() }))
jest.mock('../../../main/externalData')

jest.mock('../../../main/store/persist')

jest.mock('../../../main/nebula', () => jest.fn(() => ({ ready: () => true, ens: { lookupAddress: jest.fn() } })))

const weiToHex = wei => addHexPrefix(wei.toString(16))
const gweiToHex = gwei => weiToHex(gwei * 1e9)

const account = {
  id: '0x22dd63c3619818fdbc262c78baee43cb61e9cccf',
  name: 'Seed Account',
  lastSignerType: 'seed',
  address: '0x22dd63c3619818fdbc262c78baee43cb61e9cccf',
  status: 'ok',
  signer: '3935336131653838663031303266613139373335616337626261373962343231',
  requests: {},
  ensName: null,
  tokens: {},
  created: '12819530:1626189153547'
}
const account2 = {
  id: '0xef8f1bbe054ad30c6af774ed7a7c70a74ef77ac5',
  name: 'Ledger Account',
  lastSignerType: 'ledger',
  address: '0xef8f1bbe054ad30c6af774ed7a7c70a74ef77ac5',
  status: 'ok',
  active: false,
  signer: '',
  requests: {},
  ensName: '',
  created: '15315799:1660153882707',
} 

let Accounts, request

beforeAll(async () => {
  log.transports.console.level = false

  jest.useFakeTimers()

  store.updateAccount(account)
  store.updateAccount(account2)

  // need to import this after mocks are set up
  Accounts = (await import('../../../main/accounts')).default
})

afterAll(() => {
  log.transports.console.level = 'debug'

  jest.useRealTimers()
})

beforeEach(() => {
  request = {
    handlerId: 1,
    type: 'transaction',
    data: {
      from : '0x22dd63c3619818fdbc262c78baee43cb61e9cccf',
      chainId: '0x1',
      gasLimit: weiToHex(21000),
      gasPrice: gweiToHex(30),
      type: '0x2',
      maxPriorityFeePerGas: gweiToHex(1),
      maxFeePerGas: gweiToHex(9),
      nonce: '0xa'
    },
    payload: {
      jsonrpc: '2.0',
      id: 7,
      method: 'eth_signTransaction'
    }
  }

  Accounts.setSigner(account.address, jest.fn())

  provider.emit = jest.fn()
  provider.send = jest.fn()
})

afterEach(() => {
  Object.values(Accounts.accounts).forEach(account => {
    account.requests = {}
  })
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
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set an invalid base fee', done => {
    setBaseFee('wrong', err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set a negative base fee', done => {
    setBaseFee('-0x12a05f200', err => {
      expect(err.message).toBeTruthy()
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

  it('applies automatic base fee update', done => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    const updatedBaseFee = 6 // gwei

    setBaseFee(gweiToHex(updatedBaseFee), err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(weiToHex(2e9 + (updatedBaseFee * 1e9)))
        done()
      } catch (e) { done(e) }
    })
  })

  it('applies user-initiated base fee update', done => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setBaseFee(gweiToHex(6), err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(gweiToHex(8))
        done()
      } catch (e) { done(e) }
    }, 1, true)
  })

  it('does not update if the base fee has not changed', done => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setBaseFee(gweiToHex(8), err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(gweiToHex(10))
        done()
      } catch (e) { done(e) }
    })
  })

  it('caps the base fee at 9999 gwei', done => {
    const highBaseFee = gweiToHex(10200)
    const maxBaseFee = 9999e9
    const expectedMaxFee = weiToHex(maxBaseFee + parseInt(request.data.maxPriorityFeePerGas))

    setBaseFee(highBaseFee, err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
        done()
      } catch (e) { done(e) }
    })
  })

  it('does not exceed the max allowable fee', done => {
    const maxTotal = 2e18 // 2 ETH
    const gasLimit = 1e7
    const maxFee = maxTotal / gasLimit
    const highBaseFee = weiToHex(maxFee + 10e9) // add 10 gwei to exceed the maximum limit

    request.data.gasLimit = weiToHex(gasLimit)

    setBaseFee(highBaseFee, err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(weiToHex(maxFee))
        done()
      } catch (e) { done(e) }
    })
  })

  it('updates the feesUpdatedByUser flag', done => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setBaseFee(gweiToHex(10), err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].feesUpdatedByUser).toBe(true)
        done()
      } catch (e) { done(e) }
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
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set an invalid priority fee', done => {
    setPriorityFee('incorrect', err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set a negative priority fee', done => {
    setPriorityFee('-0x12a05f200', err => {
      expect(err.message).toBeTruthy()
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
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(weiToHex(priorityFee))
        expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
        done()
      } catch (e) { done(e) }
    })
  })

  it('does not update if the priority fee has not changed', done => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setPriorityFee(gweiToHex(2), err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(gweiToHex(10))
        expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(gweiToHex(2))
        done()
      } catch (e) { done(e) }
    })
  })

  it('caps the priority fee at 9999 gwei', done => {
    const highPriorityFee = gweiToHex(10200)
    const maxPriorityFee = 9999e9
    const priorityFeeChange = maxPriorityFee - parseInt(request.data.maxPriorityFeePerGas)
    const expectedMaxFee = weiToHex(priorityFeeChange + parseInt(request.data.maxFeePerGas))

    setPriorityFee(highPriorityFee, err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(weiToHex(maxPriorityFee))
        expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
        done()
      } catch (e) { done(e) }
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
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(weiToHex(expectedPriorityFee))
        expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(weiToHex(maxFee))
        done()
      } catch (e) { done(e) }
    })
  })

  it('updates the feesUpdatedByUser flag', done => {
    setPriorityFee('0x12a05f200', err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].feesUpdatedByUser).toBe(true)
        done()
      } catch (e) { done(e) }
    }, 1, true)
  })
})

describe('#setGasPrice', () => {
  beforeEach(() => {
    Accounts.addRequest(request, jest.fn())
    request.data.type = '0x0'
  })

  const setGasPrice = (price, cb, requestId = 1, userUpdate = false) => Accounts.setGasPrice(price, requestId, userUpdate, cb)

  it('does not set an undefined gas price', done => {
    setGasPrice(undefined, err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set an invalid gas price', done => {
    setGasPrice(Number.NaN, err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set a negative gas price', done => {
    setGasPrice('-0x23', err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set a gas price if no account is active', done => {
    Accounts.unsetSigner(jest.fn())

    setGasPrice('0x23', err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('fails to find the request', done => {
    setGasPrice('0x23', err => {
      expect(err.message).toBeTruthy()
      done()
    }, 2)
  })

  it('does not set a gas price on a non-transaction request', done => {
    request.type = 'message'

    setGasPrice('0x23', err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set a gas price on a locked request', done => {
    request.locked = true

    setGasPrice('0x23', err => {
      expect(err.message).toBeTruthy()
      expect(Accounts.current().requests[1].data.gasPrice).toBe(request.data.gasPrice)
      done()
    })
  })

  it('does not set a gas price on an automatic update if fees were manually set by the user', done => {
    request.feesUpdatedByUser = true

    setGasPrice('0x23', err => {
      expect(err.message).toBeTruthy()
      expect(Accounts.current().requests[1].data.gasPrice).toBe(request.data.gasPrice)
      done()
    }, 1, false)
  })

  it('sets a valid gas price', done => {
    setGasPrice('0x23', err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.gasPrice).toBe('0x23')
        done()
      } catch (e) { done(e) }
    })
  })

  it('does not update if the gas price has not changed', done => {
    request.data.gasPrice = gweiToHex(10)

    setGasPrice(gweiToHex(10), err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.gasPrice).toBe(gweiToHex(10))
        done()
      } catch (e) { done(e) }
    })
  })

  it('does not exceed the max gas price', done => {
    const maxTotal = 2e18 // 2 ETH
    const gasLimit = 1e7
    const maxFee = maxTotal / gasLimit
    const highPrice = weiToHex(maxFee + 10e9) // 250 gwei

    request.data.gasLimit = weiToHex(gasLimit)

    setGasPrice(highPrice, err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.gasPrice).toBe(weiToHex(maxFee))
        done()
      } catch (e) { done(e) }
    })
  })

  it('caps the gas price at 9999 gwei', done => {
    const maxPrice = gweiToHex(9999)
    const highPrice = gweiToHex(10200)

    setGasPrice(highPrice, err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.gasPrice).toBe(maxPrice)
        done()
      } catch (e) { done(e) }
    })
  })

  it('updates the feesUpdatedByUser flag', done => {
    request.data.gasPrice = gweiToHex(30)
    
    setGasPrice(gweiToHex(45), err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].feesUpdatedByUser).toBe(true)
        done()
      } catch (e) { done(e) }
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
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set an invalid gas limit', done => {
    setGasLimit(Number.NaN, err => {
      expect(err.message).toBeTruthy()
      done()
    })
  })

  it('does not set a negative gas limit', done => {
    setGasLimit('-0x61a8', err => {
      expect(err.message).toBeTruthy()
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

  it('does not set a gas limit on an automatic update if fees were manually set by the user', done => {
    request.feesUpdatedByUser = true

    setGasLimit('0x61a8', err => {
      expect(err.message).toBeTruthy()
      expect(Accounts.current().requests[1].data.gasLimit).toBe(request.data.gasLimit)
      done()
    }, 1, false)
  })

  it('sets a valid gas limit', done => {
    setGasLimit('0x61a8', err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.gasLimit).toBe('0x61a8')
        done()
      } catch (e) { done(e) }
    })
  })

  it('does not exceed the max fee for pre-EIP-1559 transactions', done => {
    const maxFee = 2e18 // 2 ETH
    const gasPrice = 400e9 // 400 gwei
    const maxLimit = maxFee / gasPrice
    const gasLimit = weiToHex(maxLimit + 1e5) // add 10000 to exceed the maximum limit

    request.data.type = '0x0'
    request.data.gasPrice = weiToHex(gasPrice)

    setGasLimit(gasLimit, err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.gasLimit).toBe(weiToHex(maxLimit))
        done()
      } catch (e) { done(e) }
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
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.gasLimit).toBe(weiToHex(maxLimit))
        done()
      } catch (e) { done(e) }
    })
  })

  it('caps the gas limit at 12.5e6', done => {
    const maxLimit = weiToHex(12.5e6)
    const highLimit = weiToHex(13e6)

    setGasLimit(highLimit, err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].data.gasLimit).toBe(maxLimit)
        done()
      } catch (e) { done(e) }
    })
  })

  it('updates the feesUpdatedByUser flag', done => {
    setGasLimit('0x61a8', err => {
      try {
        expect(err).toBeFalsy()
        expect(Accounts.current().requests[1].feesUpdatedByUser).toBe(true)
        done()
      } catch (e) { done(e) }
    }, 1, true)
  })
})

describe('#adjustNonce', () => {
  let onChainNonce

  beforeEach(() => {
    provider.send.mockImplementation((payload, cb) => {
      expect(payload).toEqual(expect.objectContaining({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: ['0x22dd63c3619818fdbc262c78baee43cb61e9cccf', 'pending']
      }))

      cb({ result: onChainNonce })
    })

    onChainNonce = '0x0'
    Accounts.addRequest(request, jest.fn())
  })

  const adjustNonce = (nonceAdjust, requestId = 1) => Accounts.adjustNonce(requestId, nonceAdjust)

  it('does not allow an invalid adjustment', () => {
    adjustNonce(2)

    expect(Accounts.current().requests[1].data.nonce).toBe(request.data.nonce)
  })

  it('does not adjust a request if no account is active', () => {
    adjustNonce(1)

    expect(Accounts.current().requests[1].data.nonce).toBe(request.data.nonce)
  })

  it('adjusts the provided nonce up one increment', () => {
    const expectedNonce = addHexPrefix((parseInt(request.data.nonce) + 1).toString(16))

    adjustNonce(1)

    expect(Accounts.current().requests[1].data.nonce).toBe(expectedNonce)
  })

  it('adjusts the provided nonce down one increment', () => {
    const expectedNonce = addHexPrefix((parseInt(request.data.nonce) - 1).toString(16))

    adjustNonce(-1)

    expect(Accounts.current().requests[1].data.nonce).toBe(expectedNonce)
  })

  it('gets the latest nonce from the chain', () => {
    onChainNonce = '0x5'

    delete request.data.nonce

    adjustNonce(1)

    expect(Accounts.current().requests[1].data.nonce).toBe(onChainNonce)
  })

  it('gets the latest nonce from the chain and adjusts it down one increment', () => {
    onChainNonce = '0x5'
    const expectedNonce = addHexPrefix((parseInt(onChainNonce) - 1).toString(16))

    delete request.data.nonce

    adjustNonce(-1)

    expect(Accounts.current().requests[1].data.nonce).toBe(expectedNonce)
  })
})

describe('#resolveRequest', () => {
  it ('does nothing with an unknown request', () => {
    Accounts.addRequest(request, () => {
      throw new Error('unexpected callback!')
    })

    Accounts.resolveRequest({ handlerId: '-1' })

    expect(Object.keys(Accounts.current().requests)).toHaveLength(1)
  })

  it ('resolves a request with a callback', done => {
    Accounts.addRequest(request, () => done())

    Accounts.resolveRequest(request)

    try {
      expect(Object.keys(Accounts.current().requests)).toHaveLength(0)
    } catch (e) { done(e) }
  })

  it ('resolves a request with no callback', () => {
    Accounts.addRequest(request)

    Accounts.resolveRequest(request)

    expect(Object.keys(Accounts.current().requests)).toHaveLength(0)
  })
})

describe('#removeRequest', () => {
  beforeEach(() => {
    store.navClearReq = jest.fn()
    account.update = jest.fn()
  })

  it('should remove a request for the provided handlerId from the account object', () => {
    Accounts.addRequest(request)
    Accounts.removeRequest(account, request.handlerId)

    expect(Object.keys(account.requests)).toHaveLength(0)
  })

  it('should clear a request for the provided handlerId from the nav', () => {
    Accounts.addRequest(request)
    Accounts.removeRequest(account, request.handlerId)

    expect(store.navClearReq).toHaveBeenCalledWith(request.handlerId)
  })

  it('should update the account', () => {
    Accounts.addRequest(request)
    Accounts.removeRequest(account, request.handlerId)

    expect(account.update).toHaveBeenCalled()
  })
})

describe('#removeRequests', () => {
  beforeEach(() => {
    Accounts.removeRequest = jest.fn()
    Accounts.addRequest(request)
    Accounts.setSigner(account2.address, () => {
      Accounts.addRequest({ ...request, data: { ...request.data, type: '0x1' } })
    })
  })

  it('should remove the requests for a given handlerId across accounts', () => {
    Accounts.removeRequests(request.handlerId)

    expect(Object.keys(account.requests)).toHaveLength(0)
    expect(Object.keys(account2.requests)).toHaveLength(0)
  })

  it('should not remove requests when there are none matching the given handlerId', () => {
    Accounts.removeRequests('4')

    expect(Accounts.removeRequest).not.toHaveBeenCalled()
  })
})