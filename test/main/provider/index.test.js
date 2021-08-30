import EventEmitter from 'events'
import { utils } from 'ethers'
import { addHexPrefix } from 'ethereumjs-util'
import log from 'electron-log'

log.transports.console.level = false

const mockAccounts = {}
const mockStore = {
  'main.accounts': {
    "0x22dd63c3619818fdbc262c78baee43cb61e9cccf": {}
  },
  'main.currentNetwork': {
    type: 'ethereum',
    id: 1
  },
  'main.networks.ethereum.1': {
    id: 1
  },
  'main.networks.ethereum.4': {
    id: 4
  }
}

class MockConnection extends EventEmitter {
  constructor () {
    super()
    
    this.syncDataEmit = jest.fn()
    this.send = jest.fn((payload, cb, targetChain) => {
      cb({ error: 'received unhandled request' })
    })
  }
}

let provider, mockConnection

jest.mock('../../../main/chains', () => mockConnection)
jest.mock('../../../main/accounts', () => mockAccounts)

jest.mock('../../../main/store', () => {
  const store = (...args) => mockStore[args.join('.')]

  store.updateAccount = () => {}
  store.observer = () => {}
  return store
})

beforeAll(async () => {
  mockConnection = new MockConnection()

  // need to import this after mocks are set up
  provider = (await import('../../../main/provider')).default
  provider.handlers = {}
})

describe('#getRawTx', () => {
  it('leaves a valid value unchanged', () => {
    const tx = provider.getRawTx({ value: '0x2540be400' })

    expect(tx.value).toBe('0x2540be400')
  })

  it('removes a leading zero from a valid value', () => {
    const tx = provider.getRawTx({ value: '0x0a45c6' })

    expect(tx.value).toBe('0xa45c6')
  })

  it('leaves a valid zero value unchanged', () => {
    const tx = provider.getRawTx({ value: '0x0' })

    expect(tx.value).toBe('0x0')
  })

  it('turns a zero value into the correct hex value for zero', () => {
    const tx = provider.getRawTx({ value: '0x' })

    expect(tx.value).toBe('0x0')
  })

  it('turns an undefined value into the correct hex value for zero', () => {
    const tx = provider.getRawTx({ value: undefined })

    expect(tx.value).toBe('0x0')
  })
})

describe('#send', () => {
  let accountRequests = []
  const send = (request, cb = jest.fn(), targetChain) => provider.send(request, cb, targetChain)

  const address = '0x22dd63c3619818fdbc262c78baee43cb61e9cccf'

  beforeEach(() => {
    accountRequests = []

    mockAccounts.current = jest.fn(() => ({ id: address, getAccounts: () => [address] }))
    mockAccounts.addRequest = req => accountRequests.push(req)
  })

  describe('#eth_chainId', () => {
    it('returns the current chain id from the store', done => {
      send({ method: 'eth_chainId' }, response => {
        expect(response.result).toBe('0x1')
        done()
      })
    })

    it('returns a chain id from the target chain', done => {
      send({ method: 'eth_chainId' }, response => {
        expect(response.result).toBe('0x4')
        done()
      }, { type: 'ethereum', id: 4 })
    })
  })

  describe('#eth_sign', () => {
    const message = 'hello, Ethereum!'

    it('submits a request to sign a message', () => {
      send({ method: 'eth_sign', params: [address, message] })

      expect(accountRequests).toHaveLength(1)
      expect(accountRequests[0].handlerId).toBeTruthy()
      expect(accountRequests[0].payload.params[0]).toBe(address)
      expect(accountRequests[0].payload.params[1]).toEqual(message)
    })

    it('does not submit a request from an account other than the current one', done => {
      const params = ['0xa4581bfe76201f3aa147cce8e360140582260441', message]

      send({ method: 'eth_sign', params }, err => {
        expect(err.error).toBeTruthy()
        done()
      })
    }, 100)
  })

  describe('#personal_sign', () => {
    const message = 'hello, Ethereum!'

    it('submits a request to sign a personal message', () => {
      send({ method: 'personal_sign', params: [message, address] })

      expect(accountRequests).toHaveLength(1)
      expect(accountRequests[0].handlerId).toBeTruthy()
      expect(accountRequests[0].payload.params[0]).toBe(address)
      expect(accountRequests[0].payload.params[1]).toEqual(message)
    })

    it('does not submit a request from an account other than the current one', done => {
      const params = ['0xa4581bfe76201f3aa147cce8e360140582260441', message]

      send({ method: 'personal_sign', params }, err => {
        expect(err.error).toBeTruthy()
        done()
      })
    }, 100)
  })

  describe('#eth_signTypedData', () => {
    const typedData = {
      types: {
          EIP712Domain: 'domain',
          Bid: 'bid',
          Identity: 'identity',
      },
      domain: 'domainData',
      primaryType: 'Bid',
      message: 'message'
    }

    const validRequests = [
      // the first 2 parameters are reversed for V1
      { method: 'eth_signTypedData', params: [typedData, address], version: 'V1' },
      { method: 'eth_signTypedData_v1', params: [typedData, address], version: 'V1' },
      { method: 'eth_signTypedData_v3', params: [address, typedData], version: 'V3' },
      { method: 'eth_signTypedData_v4', params: [address, typedData], version: 'V4' }
    ]

    function verifyRequest (version) {
      expect(accountRequests).toHaveLength(1)
      expect(accountRequests[0].handlerId).toBeTruthy()
      expect(accountRequests[0].payload.params[0]).toBe(address)
      expect(accountRequests[0].payload.params[1]).toEqual(typedData)
      expect(accountRequests[0].version).toBe(version)
    }
    
    validRequests.forEach(({ method, params, version }) => {
      it(`submits a ${method} request to sign typed data`, () => {
        send({ method, params })
  
        verifyRequest(version)
      })
    })

    it('handles typed data as a stringified json param', () => {
      const params = [JSON.stringify(typedData), address]

      send({ method: 'eth_signTypedData', params })

      verifyRequest('V1')
    })

    it('does not submit a request from an account other than the current one', done => {
      const params = ['0xa4581bfe76201f3aa147cce8e360140582260441', typedData]

      send({ method: 'eth_signTypedData_v3', params }, err => {
        expect(err.error).toBeTruthy()
        done()
      })
    }, 100)

    it('does not submit a request with malformed type data', done => {
      const params = [address, 'test']

      send({ method: 'eth_signTypedData_v3', params }, err => {
        expect(err.error).toBeTruthy()
        done()
      })
    }, 100)

    it('passes a request with an unknown version through to the connection', done => {
      const params = [address, 'test']

      send({ method: 'eth_signTypedData_v5', params }, err => {
        expect(err.error).toBe('received unhandled request')
        done()
      })
    })
  })
})

describe('#signAndSend', () => {
  let tx = {}, request = {}

  const signAndSend = (cb = jest.fn()) => provider.signAndSend(request, cb)

  beforeEach(() => {
    tx = {}

    request = {
      handlerId: 99,
      payload: { jsonrpc: '2.0', id: 2, method: 'eth_sendTransaction' },
      data: tx
    }
  })
  
  it('does not allow a pre-EIP-1559 transaction with fees that exceed the hard limit', done => {
    // 200 gwei * 10M gas = 2 ETH
    tx.type = '0x0'
    tx.gasPrice = utils.parseUnits('210', 'gwei').toHexString()
    tx.gasLimit = addHexPrefix((1e7).toString(16))

    signAndSend(err => {
      expect(err.message).toMatch(/over hard limit/)
      done()
    })
  })
  
  it('does not allow a post-EIP-1559 transaction with fees that exceed the hard limit', done => {
    // 200 gwei * 10M gas = 2 ETH
    tx.type = '0x2'
    tx.maxFeePerGas = utils.parseUnits('210', 'gwei').toHexString()
    tx.gasLimit = addHexPrefix((1e7).toString(16))

    signAndSend(err => {
      expect(err.message).toMatch(/over hard limit/)
      done()
    })
  })

  describe('broadcasting transactions', () => {
    const signedTx = '0x2eca5b929f8a671f0a3c0a7996f83141b2260fdfac62a1da8a8098b326001b99'
    const txHash = '0x6e8b1de115105ceab599b4d99604797b961cfd1f46b85e10f23a81974baae3d5'

    beforeEach(() => {
      mockAccounts.signTransaction = jest.fn((_, cb) => cb(null, signedTx))
      mockAccounts.setTxSigned = jest.fn((reqId, cb) => {
        if (reqId === request.handlerId) return cb()
        cb('unknown request!')
      })

      jest.useFakeTimers()
    })
  
    afterEach(() => {
      jest.useRealTimers()
    })

    describe('success', () => {
      beforeEach(() => {
        mockConnection.send.mockImplementation((payload, cb) => {
          if (payload.id === request.payload.id && 
              payload.method === 'eth_sendRawTransaction' &&
              payload.params[0] === signedTx) {
                return cb({ result: txHash })
              }
          cb('could not send transaction!')
        })
      })

      it('sends a successfully signed transaction', done => {
        signAndSend((err, result) => {
          expect(err).toBe(null)
          expect(result).toBe(txHash)
          done()
        })
  
        jest.runAllTimers()
      })

      it('responds to a successful transaction request with the transaction hash result', done => {
        provider.handlers[request.handlerId] = response => {
          expect(response.result).toBe(txHash)
          done()
        }
        
        signAndSend()
  
        jest.runAllTimers()
      })
    })

    describe('failure', () => {
      let errorMessage

      beforeEach(() => {
        errorMessage = 'invalid transaction!'
        mockConnection.send.mockImplementation((_, cb) => cb({ error: { message: errorMessage } }))
      })

      it('handles a transaction send failure', done => {
        signAndSend(err => {
          expect(err).toBe(errorMessage)
          done()
        })

        jest.runAllTimers()
      })

      it('responds to a failed transaction request with the payload', done => {
        provider.handlers[request.handlerId] = err => {
          expect(err.id).toBe(request.payload.id)
          expect(err.jsonrpc).toBe(request.payload.jsonrpc)
          expect(err.error).toBe(errorMessage)
          done()
        }

        signAndSend()

        jest.runAllTimers()
      })
    })
  })
})
