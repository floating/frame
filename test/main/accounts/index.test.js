import log from 'electron-log'
import { addHexPrefix } from 'ethereumjs-util'
import store from '../../../main/store'
import provider from '../../../main/provider'
import Accounts from '../../../main/accounts'
import signers from '../../../main/signers'
import { signerCompatibility, maxFee } from '../../../main/transaction'

import { GasFeesSource } from '../../../resources/domain/transaction'

jest.mock('../../../main/provider', () => ({ send: jest.fn(), emit: jest.fn(), on: jest.fn() }))
jest.mock('../../../main/signers', () => ({ get: jest.fn() }))
jest.mock('../../../main/windows', () => ({ broadcast: jest.fn(), showTray: jest.fn() }))
jest.mock('../../../main/windows/nav', () => ({ on: jest.fn(), forward: jest.fn() }))
jest.mock('../../../main/externalData')
jest.mock('../../../main/transaction')

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

let request

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

beforeEach(done => {
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

  Accounts.add(account2.address, 'Test Account 2')
  Accounts.add(account.address, 'Test Account 1', account, (err, account) => {
    Accounts.setSigner(account.address, done)
  })
})

afterEach(() => {
  Object.values(Accounts.accounts).forEach(account => {
    Object.keys(account.requests).forEach(id => {
      Accounts.removeRequest(account, id)
    })
  })
})

it('sets the account signer', () => {
  expect(Accounts.current().address).toBe('0x22dd63c3619818fdbc262c78baee43cb61e9cccf')
})

describe('#updatePendingFees', () => {
  beforeEach(() => {
    request.data.gasFeesSource = GasFeesSource.Frame

    store.setGasFees('ethereum', parseInt(request.data.chainId), {
      maxBaseFeePerGas: gweiToHex(9),
      maxPriorityFeePerGas: gweiToHex(2)
    })
  })

  it('updates the pending fees for a transaction', () => {
    Accounts.addRequest(request)
    Accounts.updatePendingFees(parseInt(request.data.chainId))

    expect(request.data.maxFeePerGas).toBe(gweiToHex(11))
    expect(request.data.maxPriorityFeePerGas).toBe(gweiToHex(2))
  })

  it('does not update a transaction with gas fees provided by a dapp', () => {
    request.data.gasFeesSource = GasFeesSource.Dapp

    Accounts.addRequest(request)
    Accounts.updatePendingFees(parseInt(request.data.chainId))

    expect(request.data.maxFeePerGas).toBe(gweiToHex(9))
    expect(request.data.maxPriorityFeePerGas).toBe(gweiToHex(1))
  })

  it('does not update a transaction if gas fees have been updated by the user', () => {
    request.feesUpdatedByUser = true

    Accounts.addRequest(request)
    Accounts.updatePendingFees(parseInt(request.data.chainId))

    expect(request.data.maxFeePerGas).toBe(gweiToHex(9))
    expect(request.data.maxPriorityFeePerGas).toBe(gweiToHex(1))
  })
})

describe('#setBaseFee', () => {
  beforeEach(() => {
    Accounts.addRequest(request, jest.fn())
  })

  const setBaseFee = (baseFee, requestId = 1, userUpdate = false) => Accounts.setBaseFee(baseFee, requestId, userUpdate)

  it('does not set an undefined base fee', () => {
    expect(() => setBaseFee(undefined)).toThrowError()
  })

  it('does not set an invalid base fee', () => {
    expect(() => setBaseFee('wrong')).toThrowError()
  })

  it('does not set a negative base fee', () => {
    expect(() => setBaseFee('-0x12a05f200')).toThrowError()
  })

  it('does not set a base fee for an inactive account', () => {
    Accounts.setSigner(undefined, jest.fn())

    expect(() => setBaseFee('0x1dcd65000')).toThrowError(/no account selected/i)
  })

  it('fails to find the request', () => {
    expect(() => setBaseFee('0x1dcd65000', 2)).toThrowError(/could not find transaction/i)
  })

  it('does not set a base fee on a non-transaction request', () => {
    request.type = 'message'

    expect(() => setBaseFee('0x1dcd65000')).toThrowError()
  })

  it('does not set a base fee on a locked request', () => {
    request.locked = true

    expect(() => setBaseFee('0x1dcd65000')).toThrowError()
    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(request.data.maxFeePerGas)
  })

  it('does not set a base fee on an automatic update if fees were manually set by the user', () => {
    request.feesUpdatedByUser = true

    expect(() => setBaseFee('0x1dcd65000')).toThrowError()
    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(request.data.maxFeePerGas)
  })

  it('applies automatic base fee update', () => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    const updatedBaseFee = 6 // gwei

    setBaseFee(gweiToHex(updatedBaseFee))

    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(weiToHex(2e9 + (updatedBaseFee * 1e9)))
  })

  it('applies user-initiated base fee update', () => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setBaseFee(gweiToHex(6), 1, true)

    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(gweiToHex(8))
  })

  it('does not update if the base fee has not changed', () => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setBaseFee(gweiToHex(8))

    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(gweiToHex(10))
  })

  it('caps the base fee at 9999 gwei', () => {
    const highBaseFee = gweiToHex(10200)
    const maxBaseFee = 9999e9
    const expectedMaxFee = weiToHex(maxBaseFee + parseInt(request.data.maxPriorityFeePerGas))

    setBaseFee(highBaseFee)

    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
  })

  it('does not exceed the max allowable fee', () => {
    const maxTotal = 2e18 // 2 ETH
    const gasLimit = 1e7
    const maxTotalFee = maxTotal / gasLimit
    const highBaseFee = weiToHex(maxTotalFee + 10e9) // add 10 gwei to exceed the maximum limit

    request.data.gasLimit = weiToHex(gasLimit)
    maxFee.mockReturnValue(maxTotal)

    setBaseFee(highBaseFee)

    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(weiToHex(maxTotalFee))
  })

  it('updates the feesUpdatedByUser flag', () => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setBaseFee(gweiToHex(10), 1, true)

    expect(Accounts.current().requests[1].feesUpdatedByUser).toBe(true)
  })
})

describe('#setPriorityFee', () => {
  beforeEach(() => {
    Accounts.addRequest(request, jest.fn())
  })

  const setPriorityFee = (fee, requestId = 1, userUpdate = false) => Accounts.setPriorityFee(fee, requestId, userUpdate)

  it('does not set an undefined priority fee', () => {
    expect(() => setPriorityFee(undefined)).toThrowError()
  })

  it('does not set an invalid priority fee', () => {
    expect(() => setPriorityFee('incorrect')).toThrowError()
  })

  it('does not set a negative priority fee', () => {
    expect(() => setPriorityFee('-0x12a05f200')).toThrowError()
  })

  it('does not set a priority fee if no account is active', () => {
    Accounts.setSigner(undefined, jest.fn())

    expect(() => setPriorityFee('0x12a05f200')).toThrowError(/no account selected/i)
  })

  it('fails to find the request', () => {
    expect(() => setPriorityFee('0x12a05f200', 2)).toThrowError(/could not find transaction/i)
  })

  it('does not set a priority fee on a non-transaction request', () => {
    request.type = 'message'

    expect(() => setPriorityFee('0x12a05f200')).toThrowError()
  })

  it('does not set a priority fee on a locked request', () => {
    request.locked = true

    expect(() => setPriorityFee('0x12a05f200')).toThrowError()
    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(request.data.maxFeePerGas)
  })

  it('does not set a priority fee on an automatic update if fees were manually set by the user', () => {
    request.feesUpdatedByUser = true

    expect(() => setPriorityFee('0x12a05f200')).toThrowError()
    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(request.data.maxFeePerGas)
  })


  it('sets a valid priority fee', () => {
    const priorityFee = 2e9 // 2 gwei
    const priorityFeeChange = priorityFee - parseInt(request.data.maxPriorityFeePerGas)
    const expectedMaxFee = weiToHex(priorityFeeChange + parseInt(request.data.maxFeePerGas))

    setPriorityFee(weiToHex(priorityFee))

    expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(weiToHex(priorityFee))
    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
  })

  it('does not update if the priority fee has not changed', () => {
    request.data.maxFeePerGas = gweiToHex(10)
    request.data.maxPriorityFeePerGas = gweiToHex(2)

    setPriorityFee(gweiToHex(2))

    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(gweiToHex(10))
    expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(gweiToHex(2))
  })

  it('caps the priority fee at 9999 gwei', () => {
    const highPriorityFee = gweiToHex(10200)
    const maxPriorityFee = 9999e9
    const priorityFeeChange = maxPriorityFee - parseInt(request.data.maxPriorityFeePerGas)
    const expectedMaxFee = weiToHex(priorityFeeChange + parseInt(request.data.maxFeePerGas))

    setPriorityFee(highPriorityFee)

    expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(weiToHex(maxPriorityFee))
    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(expectedMaxFee)
  })

  it('does not exceed the max allowable fee', () => {
    const maxTotal = 2e18 // 2 ETH
    const gasLimit = 1e7
    const maxTotalFee = maxTotal / gasLimit

    request.data.gasLimit = weiToHex(gasLimit)
    request.data.maxFeePerGas = gweiToHex(190)
    request.data.maxPriorityFeePerGas = gweiToHex(40)
    maxFee.mockReturnValue(maxTotal)

    const highPriorityFee = 60e9 // add 20 gwei to the above to exceed the maximum limit
    const expectedPriorityFee = maxTotalFee - (parseInt(request.data.maxFeePerGas) - parseInt(request.data.maxPriorityFeePerGas))

    setPriorityFee(highPriorityFee)

    expect(Accounts.current().requests[1].data.maxPriorityFeePerGas).toBe(weiToHex(expectedPriorityFee))
    expect(Accounts.current().requests[1].data.maxFeePerGas).toBe(weiToHex(maxTotalFee))
  })

  it('updates the feesUpdatedByUser flag', () => {
    setPriorityFee('0x12a05f200', 1, true)

    expect(Accounts.current().requests[1].feesUpdatedByUser).toBe(true)
  })
})

describe('#setGasPrice', () => {
  beforeEach(() => {
    Accounts.addRequest(request, jest.fn())
    request.data.type = '0x0'
  })

  const setGasPrice = (price, requestId = 1, userUpdate = false) => Accounts.setGasPrice(price, requestId, userUpdate)

  it('does not set an undefined gas price', () => {
    expect(() => setGasPrice(undefined)).toThrowError()
  })

  it('does not set an invalid gas price', () => {
    expect(() => setGasPrice(Number.NaN)).toThrowError()
  })

  it('does not set a negative gas price', () => {
    expect(() => setGasPrice('-0x23')).toThrowError()
  })

  it('does not set a gas price if no account is active', () => {
    Accounts.setSigner(undefined, jest.fn())

    expect(() => setGasPrice('0x23')).toThrowError(/no account selected/i)
  })

  it('fails to find the request', () => {
    expect(() => setGasPrice('0x23', 2)).toThrowError(/could not find transaction/i)
  })

  it('does not set a gas price on a non-transaction request', () => {
    request.type = 'message'

    expect(() => setGasPrice('0x23')).toThrowError()
  })

  it('does not set a gas price on a locked request', () => {
    request.locked = true

    expect(() => setGasPrice('0x23')).toThrowError()
    expect(Accounts.current().requests[1].data.gasPrice).toBe(request.data.gasPrice)
  })

  it('does not set a gas price on an automatic update if fees were manually set by the user', () => {
    request.feesUpdatedByUser = true

    expect(() => setGasPrice('0x23')).toThrowError()
    expect(Accounts.current().requests[1].data.gasPrice).toBe(request.data.gasPrice)
  })

  it('sets a valid gas price', () => {
    setGasPrice('0x23')

    expect(Accounts.current().requests[1].data.gasPrice).toBe('0x23')
  })

  it('does not update if the gas price has not changed', () => {
    request.data.gasPrice = gweiToHex(10)

    setGasPrice(gweiToHex(10))

    expect(Accounts.current().requests[1].data.gasPrice).toBe(gweiToHex(10))
  })

  it('does not exceed the max gas price', () => {
    const maxTotal = 2e18 // 2 ETH
    const gasLimit = 1e7
    const maxTotalFee = maxTotal / gasLimit
    const highPrice = weiToHex(maxTotalFee + 10e9) // 250 gwei

    request.data.gasLimit = weiToHex(gasLimit)
    maxFee.mockReturnValue(maxTotal)

    setGasPrice(highPrice)

    expect(Accounts.current().requests[1].data.gasPrice).toBe(weiToHex(maxTotalFee))
  })

  it('caps the gas price at 9999 gwei', () => {
    const maxPrice = gweiToHex(9999)
    const highPrice = gweiToHex(10200)

    setGasPrice(highPrice)

    expect(Accounts.current().requests[1].data.gasPrice).toBe(maxPrice)
  })

  it('updates the feesUpdatedByUser flag', () => {
    request.data.gasPrice = gweiToHex(30)
    
    setGasPrice(gweiToHex(45), 1, true)

    expect(Accounts.current().requests[1].feesUpdatedByUser).toBe(true)
  })
})

describe('#setGasLimit', () => {
  beforeEach(() => {
    Accounts.addRequest(request, jest.fn())
  })

  const setGasLimit = (limit, requestId = 1, userUpdate = false) => Accounts.setGasLimit(limit, requestId, userUpdate)

  it('does not set an undefined gas limit', () => {
    expect(() => setGasLimit(undefined)).toThrowError()
  })

  it('does not set an invalid gas limit', () => {
    expect(() => setGasLimit(Number.NaN)).toThrowError()
  })

  it('does not set a negative gas limit', () => {
    expect(() => setGasLimit('-0x61a8')).toThrowError()
  })

  it('does not set a gas limit if no account is active', () => {
    Accounts.setSigner(undefined, jest.fn())

    expect(() => setGasLimit('0x61a8')).toThrowError(/no account selected/i)
  })

  it('fails to find the request', () => {
    expect(() => setGasLimit('0x61a8', 2)).toThrowError(/could not find transaction/i)
  })

  it('does not set a gas limit on a non-transaction request', () => {
    request.type = 'message'

    expect(() => setGasLimit('0x61a8')).toThrowError()
  })

  it('does not set a gas limit on a locked request', () => {
    request.locked = true

    expect(() => setGasLimit('0x61a8')).toThrowError()
    expect(Accounts.current().requests[1].data.gasLimit).toBe(request.data.gasLimit)
  })

  it('does not set a gas limit on an automatic update if fees were manually set by the user', () => {
    request.feesUpdatedByUser = true

    expect(() => setGasLimit('0x61a8')).toThrowError()
    expect(Accounts.current().requests[1].data.gasLimit).toBe(request.data.gasLimit)
  })

  it('sets a valid gas limit', () => {
    setGasLimit('0x61a8')

    expect(Accounts.current().requests[1].data.gasLimit).toBe('0x61a8')
  })

  it('does not exceed the max fee for pre-EIP-1559 transactions', () => {
    const maxTotalFee = 2e18 // 2 ETH
    const gasPrice = 400e9 // 400 gwei
    const maxLimit = maxTotalFee / gasPrice
    const gasLimit = weiToHex(maxLimit + 1e5) // add 10000 to exceed the maximum limit

    request.data.type = '0x0'
    request.data.gasPrice = weiToHex(gasPrice)
    maxFee.mockReturnValue(maxTotalFee)

    setGasLimit(gasLimit)

    expect(Accounts.current().requests[1].data.gasLimit).toBe(weiToHex(maxLimit))
  })

  it('does not exceed the max fee for post-EIP-1559 transactions', () => {
    const maxTotalFee = 2e18 // 2 ETH
    const maxFeePerGas = 400e9 // 400 gwei
    const maxLimit = maxTotalFee / maxFeePerGas
    const gasLimit = weiToHex(maxLimit + 1e5) // add 10000 to exceed the maximum limit
    
    request.data.type = '0x2'
    request.data.maxFeePerGas = weiToHex(maxFeePerGas)
    maxFee.mockReturnValue(maxTotalFee)

    setGasLimit(gasLimit)

    expect(Accounts.current().requests[1].data.gasLimit).toBe(weiToHex(maxLimit))
  })

  it('caps the gas limit at 12.5e6', () => {
    const maxLimit = weiToHex(12.5e6)
    const highLimit = weiToHex(13e6)

    setGasLimit(highLimit)

    expect(Accounts.current().requests[1].data.gasLimit).toBe(maxLimit)
  })

  it('updates the feesUpdatedByUser flag', () => {
    setGasLimit('0x61a8', 1, true)

    expect(Accounts.current().requests[1].feesUpdatedByUser).toBe(true)
  })
})

describe('#adjustNonce', () => {
  let onChainNonce

  beforeEach(() => {
    provider.send = jest.fn((payload, cb) => {
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

    Accounts.resolveRequest({ payload: {}, handlerId: '-1' })

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
    Accounts.addRequest(request)
  })

  it('should remove a request for the provided handlerId from the account object', () => {
    Accounts.removeRequest(account, request.handlerId)

    expect(Object.keys(account.requests)).toHaveLength(0)
  })

  it('should clear a request for the provided handlerId from the nav', () => {
    Accounts.removeRequest(account, request.handlerId)

    expect(store.navClearReq).toHaveBeenCalledWith(request.handlerId)
  })

  it('should update the account', () => {
    Accounts.removeRequest(account, request.handlerId)

    expect(account.update).toHaveBeenCalled()
  })
})

describe('#removeRequests', () => {
  beforeEach(() => {
    store.setGasFees('ethereum', '1', { maxBaseFeePerGas: '', maxPriorityFeePerGas: '' })
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

describe('#signerCompatibility', () => {
  let activeSigner

  const lockedSeedSigner = {
    id: '13',
    type: 'seed',
    addresses: [account.id],
    status: 'locked'
  }

  beforeEach(() => {
    store.navDash = jest.fn()

    activeSigner = {
      id: '12',
      addresses: [account.id],
      summary: jest.fn()
    }

    store.newSigner(lockedSeedSigner)

    signers.get.mockImplementation((id) => {
      if (id === activeSigner.id) return activeSigner
      if (id === lockedSeedSigner.id) return lockedSeedSigner
    })

    Accounts.accounts[account.id].lastSignerType = 'seed'
    Accounts.accounts[account.id].signer = activeSigner.id
    Accounts.addRequest(request)
  })

  afterEach(() => {
    store.removeSigner(activeSigner.id)
    store.removeSigner(lockedSeedSigner.id)

    //Accounts.removeRequests([request.handlerId])
  })

  const signerTypes = ['trezor', 'ledger', 'lattice']
  
  signerTypes.forEach((signerType) => {
    it(`should open the signer menu when a ${signerType} signer is not available`, () => {
      const cb = jest.fn()

      activeSigner.status = 'disconnected'
      activeSigner.type = signerType
      store.newSigner(activeSigner)

      Accounts.accounts[account.id].signer = undefined
      Accounts.accounts[account.id].lastSignerType = signerType

      Accounts.signerCompatibility(request.handlerId, cb)

      expect(cb).toHaveBeenCalledWith(new Error('Signer unavailable'))
      expect(store.navDash).toHaveBeenCalledWith({
        data: {
          signer: activeSigner.id
        },
        view: 'expandedSigner'
      })
    })
  })

  it('should not open the signer menu if the current signer is ready', () => {
    const cb = jest.fn()
    const compatibility = { signer: activeSigner.id, tx: 'sometx', compatible: true }

    activeSigner.status = 'ok'
    signerCompatibility.mockReturnValue(compatibility)

    Accounts.signerCompatibility(request.handlerId, cb)
    
    expect(store.navDash).not.toHaveBeenCalled()
    expect(cb).toHaveBeenCalledWith(null, compatibility)
  })

  it('should open the signer panel for a signer that is not ready', () => {
    const cb = jest.fn()

    activeSigner.status = 'locked'

    Accounts.signerCompatibility(request.handlerId, cb)
    
    expect(store.navDash).toHaveBeenCalledWith({
      data: {
        signer: activeSigner.id
      },
      view: 'expandedSigner'
    })
  })

  it('should return an error when the signer is not ready', () => {
    const cb = jest.fn()

    activeSigner.status = 'locked'

    Accounts.signerCompatibility(request.handlerId, cb)
    
    expect(cb).toHaveBeenCalledWith(new Error('Signer unavailable'))
  })

  it('should return an error when there is no signer', () => {
    const cb = jest.fn()

    Accounts.accounts[account.id].signer = undefined

    Accounts.signerCompatibility(request.handlerId, cb)
    
    expect(store.navDash).not.toHaveBeenCalled()
    expect(cb).toHaveBeenCalledWith(new Error('No signer'))
  })
})
