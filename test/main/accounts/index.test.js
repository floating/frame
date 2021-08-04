import { addHexPrefix } from 'ethereumjs-util'
import store from '../../../main/store'

jest.mock('../../../main/store', () => require('../../../main/store/__mocks__/store.js'))
jest.mock('../../../main/signers', () => jest.fn())
jest.mock('../../../main/windows', () => ({ broadcast: jest.fn(), showTray: jest.fn() }))
jest.mock('../../../main/externalData')
jest.mock('../../../main/nebula', () => jest.fn(() => ({
  ens: {
    lookupAddress: jest.fn()
  }
})))


const log = require('electron-log')
log.transports.console.level = false

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

let Accounts, request

beforeAll(async () => {
  store.addAccount(account.id, account)

  // need to import this after mocks are set up
  Accounts = (await import('../../../main/accounts')).default
})

beforeEach(() => {
  request = {
    handlerId: 1,
    type: 'transaction',
    data: {
      gasLimit: weiToHex(21000),
      gasPrice: gweiToHex(30),
      type: '0x2',
      maxPriorityFeePerGas: gweiToHex(1),
      maxFeePerGas: gweiToHex(9),
      nonce: '0xa'
    }
  }

  Accounts.setSigner(account.address, jest.fn())
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

  it('adds a 5% buffer to an automatic base fee update', done => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    const updatedBaseFee = 6 // gwei

    setBaseFee(gweiToHex(updatedBaseFee), err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(weiToHex(2e9 + (updatedBaseFee * 1e9 * 1.05)))
      done()
    })
  })

  it('adds no buffer to a user-initiated base fee update', done => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setBaseFee(gweiToHex(6), err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(gweiToHex(8))
      done()
    }, 1, true)
  })

  it('does not update if the base fee has not changed', done => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setBaseFee(gweiToHex(8), err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(gweiToHex(10))
      done()
    })
  })

  it('updates if the base fee has lowered by more than 10%', done => {
    request.data.maxFeePerGas = gweiToHex(20)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    const updatedBaseFee = 14 // gwei
    const expectedMaxFee = weiToHex(2e9 + (updatedBaseFee * 1e9 * 1.05))

    setBaseFee(gweiToHex(updatedBaseFee), err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
      done()
    })
  })

  it('does not make an automatic update if the base fee has lowered by less than 10%', done => {
    request.data.maxFeePerGas = gweiToHex(20)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setBaseFee(gweiToHex(17), err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(gweiToHex(20))
      done()
    })
  })

  it('caps the base fee at 9999 gwei', done => {
    const highBaseFee = gweiToHex(10200)
    const maxBaseFee = 9999e9
    const expectedMaxFee = weiToHex((maxBaseFee * 1.05) + parseInt(request.data.maxPriorityFeePerGas))

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
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setBaseFee(gweiToHex(10), err => {
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
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(weiToHex(priorityFee))
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
      done()
    })
  })

  it('does not update if the priority fee has not changed', done => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setPriorityFee(gweiToHex(2), err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(gweiToHex(10))
      expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(gweiToHex(2))
      done()
    })
  })

  it('does not make an automatic update if the priority fee has changed by less than 5%', done => {
    request.data.maxFeePerGas = gweiToHex(160)
    request.data.maxPriorityFeePerGas = gweiToHex(40)

    setPriorityFee(gweiToHex(41), err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(gweiToHex(160))
      expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(gweiToHex(40))
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
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasPrice).toBe('0x23')
      done()
    })
  })

  it('does not update if the gas price has not changed', done => {
    request.data.gasPrice = gweiToHex(10)

    setGasPrice(gweiToHex(10), err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasPrice).toBe(gweiToHex(10))
      done()
    })
  })

  it('does not make an automatic update if the gas price has changed by less than 5%', done => {
    request.data.gasPrice = gweiToHex(40)

    setGasPrice(gweiToHex(39), err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasPrice).toBe(gweiToHex(40))
      done()
    })
  })

  it('does not exceed the max gas price', done => {
    const maxTotal = 2e18 // 2 ETH
    const gasLimit = 1e7
    const maxFee = maxTotal / gasLimit
    const highPrice = weiToHex(maxFee + 10e9) // 250 gwei

    request.data.gasLimit = weiToHex(gasLimit)

    setGasPrice(highPrice, err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasPrice).toBe(weiToHex(maxFee))
      done()
    })
  })

  it('caps the gas price at 9999 gwei', done => {
    const maxPrice = gweiToHex(9999)
    const highPrice = gweiToHex(10200)

    setGasPrice(highPrice, err => {
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasPrice).toBe(maxPrice)
      done()
    })
  })

  it('updates the feesUpdatedByUser flag', done => {
    request.data.gasPrice = gweiToHex(30)
    
    setGasPrice(gweiToHex(45), err => {
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
      expect(err).toBe(undefined)
      expect(Accounts.current().requests[1].data.gasLimit).toBe('0x61a8')
      done()
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

describe('#adjustNonce', () => {
  let onChainNonce

  const mockProxyProvider = {
    emit: (event, payload, cb) => {
      if (event === 'send' && payload.method === 'eth_getTransactionCount') {
        return cb({ result: onChainNonce })
      }

      cb({ error: 'wrong call!' })
    }
  }

  jest.mock('../../../main/provider/proxy', () => mockProxyProvider)

  beforeEach(() => {
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
