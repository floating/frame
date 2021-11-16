import EventEmitter from 'events'
import { utils } from 'ethers'
import { addHexPrefix } from 'ethereumjs-util'
import log from 'electron-log'

const mockAccounts = {}
const mockStore = {
  'main.accounts': {
    '0x22dd63c3619818fdbc262c78baee43cb61e9cccf': {}
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
    this.send = jest.fn()
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
  log.transports.console.level = false

  mockConnection = new MockConnection()

  // need to import this after mocks are set up
  provider = (await import('../../../main/provider')).default
  provider.handlers = {}
})

afterAll(() => {
  log.transports.console.level = 'debug'
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

    mockConnection.send.mockImplementation((payload, cb, targetChain) => {
      cb({ error: 'received unhandled request' })
    })

    mockAccounts.current = jest.fn(() => ({ id: address, getAccounts: () => [address] }))
    mockAccounts.addRequest = (req, res) => {
      accountRequests.push(req)
      if (res) res()
    }
    mockAccounts.getAccounts = () => [address]
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

  describe('#wallet_addEthereumChain', () => {
    it('adds the current chain to the store', done => {
      send({ 
        method: 'wallet_addEthereumChain', 
        params: [
          {
            chainId: '0x1234', // A 0x-prefixed hexadecimal string
            chainName: 'New Chain',
            nativeCurrency: {
              name: 'New',
              symbol: 'NEW', // 2-6 characters long
              decimals: 18
            },
            rpcUrls: ['https://pylon.link'],
            blockExplorerUrls: ['https://pylon.link'],
            iconUrls: [''] // Currently ignored
          }
        ] 
      }, () => {
        try {
          expect(accountRequests).toHaveLength(1)
          expect(accountRequests[0].handlerId).toBeTruthy()
          expect(accountRequests[0].type).toBe('addChain')
          done()
        } catch (e) { 
          done(e) 
        }
      })
    })

    it('adds switch chain request if chain exists', done => {
      send({ 
        method: 'wallet_addEthereumChain', 
        params: [
          {
            chainId: '0x1', // A 0x-prefixed hexadecimal string
            chainName: 'Mainnet',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH', // 2-6 characters long
              decimals: 18
            },
            rpcUrls: ['https://pylon.link'],
            blockExplorerUrls: ['https://pylon.link'],
            iconUrls: [''] // Currently ignored
          }
        ] 
      }, () => {
        try {
          expect(accountRequests).toHaveLength(1)
          expect(accountRequests[0].handlerId).toBeTruthy()
          expect(accountRequests[0].type).toBe('switchChain')
          done()
        } catch (e) { 
          done(e) 
        }
      })
    })
  })

  describe('#wallet_switchEthereumChain', () => {
    it('switches to chain if chain exists in store', done => {
      send({ 
        method: 'wallet_switchEthereumChain', 
        params: [{
          chainId: '0x1'
        }]
      }, () => {
        try {
          expect(accountRequests).toHaveLength(1)
          expect(accountRequests[0].handlerId).toBeTruthy()
          expect(accountRequests[0].type).toBe('switchChain')
          done()
        } catch (e) { 
          done(e) 
        }
      })
    })

    it('rejects switch if chain doesn\'t exist in the store', done => {
      send({
        method: 'wallet_switchEthereumChain', 
        params: [{
          chainId: '0x1234'
        }]
      }, () => {
        try {
          expect(accountRequests).toHaveLength(0)
          done()
        } catch (e) { 
          done(e) 
        }
      })
    })
  })
  
  describe('#wallet_getPermissions', () => {
    it('returns all allowed permissions', done => {
      const request = {
        method: 'wallet_getPermissions'
      }

      send(request, response => {
        try {
          expect(response.error).toBe(undefined)

          const permissions = response.result
          expect(permissions).toHaveLength(13)
          expect(permissions.map(p => p.parentCapability)).toEqual(expect.arrayContaining(
            [
              'eth_coinbase',
              'eth_accounts',
              'eth_requestAccounts',
              'eth_sendTransaction',
              'personal_sign',
              'personal_ecRecover',
              'eth_sign',
              'eth_signTypedData',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
              'wallet_switchEthereumChain',
              'wallet_addEthereumChain'
            ]
          ))

          done()
        } catch (e) { done(e) }
      })
    })
  })

  describe('#wallet_requestPermissions', () => {
    it('returns the requested permissions', done => {
      const request = {
        method: 'wallet_requestPermissions',
        params: [
          { eth_accounts: {} },
          { eth_signTransaction: {} }
        ]
      }

      send(request, response => {
        try {
          expect(response.error).toBe(undefined)

          const permissions = response.result
          expect(permissions).toHaveLength(2)
          expect(permissions[0].parentCapability).toBe('eth_accounts')
          expect(Number.isInteger(permissions[0].date)).toBe(true)
          expect(permissions[1].parentCapability).toBe('eth_signTransaction')
          expect(Number.isInteger(permissions[1].date)).toBe(true)
          done()
        } catch (e) { done(e) }
      })
    })
  })

  describe('#eth_getTransactionByHash', () => {
    const txHash = '0x06c1c968d4bd20c0ebfed34f6f34d8a5d189d9d2ce801f2ee8dd45dac32628d5'
    const request = { method: 'eth_getTransactionByHash', params: [txHash] }
    const chain = '4'

    let blockResult

    beforeEach(() => {
      mockConnection.send.mockImplementation((payload, res, targetChain) => {
        if (targetChain.id === chain && payload.params[0] === txHash) {
          return res({ result: blockResult })
        }

        res({ error: 'invalid request' })
      })
    })

    it('returns the response from the connection', done => {
      blockResult = {
        blockHash: '0xc1b0227f0721a05357b2b417e3872c5f6f01da209422013fe66ee291527fb123',
        blockNumber: '0xc80d08'
      }

      send(request, response => {
        expect(response.result.blockHash).toBe('0xc1b0227f0721a05357b2b417e3872c5f6f01da209422013fe66ee291527fb123')
        expect(response.result.blockNumber).toBe('0xc80d08')
        done()
      }, { type: 'ethereum', id: chain })
    })

    it('uses maxFeePerGas as the gasPrice if one is not defined', done => {
      const fee = `0x${(10e9).toString(16)}`

      blockResult = {
        maxFeePerGas: fee
      }

      send(request, response => {
        expect(response.result.gasPrice).toBe(fee)
        expect(response.result.maxFeePerGas).toBe(fee)
        done()
      }, { type: 'ethereum', id: chain })
    })

    it('maintains the gasPrice if maxFeePerGas exists', done => {
      const gasPrice = `0x${(8e9).toString(16)}`
      const maxFeePerGas = `0x${(10e9).toString(16)}`

      blockResult = {
        gasPrice,
        maxFeePerGas
      }

      send(request, response => {
        expect(response.result.gasPrice).toBe(gasPrice)
        expect(response.result.maxFeePerGas).toBe(maxFeePerGas)
        done()
      }, { type: 'ethereum', id: chain })
    })

    it('returns a response with no result attribute', done => {
      send(request, response => {
        expect(response.error).toBe('invalid request')
        done()
      }, '1')
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

    it('submits a request to sign a personal message with the address first', () => {
      send({ method: 'personal_sign', params: [message, address] })

      expect(accountRequests).toHaveLength(1)
      expect(accountRequests[0].handlerId).toBeTruthy()
      expect(accountRequests[0].payload.params[0]).toBe(address)
      expect(accountRequests[0].payload.params[1]).toEqual(message)
    })

    it('submits a request to sign a personal message with the message first', () => {
      send({ method: 'personal_sign', params: [address, message] })

      expect(accountRequests).toHaveLength(1)
      expect(accountRequests[0].handlerId).toBeTruthy()
      expect(accountRequests[0].payload.params[0]).toBe(address)
      expect(accountRequests[0].payload.params[1]).toEqual(message)
    })

    it('does not submit a request from an account other than the current one', done => {
      const params = [message, '0xa4581bfe76201f3aa147cce8e360140582260441']

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
        expect(err.error.message).toBeTruthy()
        expect(err.error.code).toBe(-1)
        done()
      })
    }, 100)

    it('does not submit a request with malformed type data', done => {
      const params = [address, 'test']

      send({ method: 'eth_signTypedData_v3', params }, err => {
        expect(err.error.message).toBeTruthy()
        expect(err.error.code).toBe(-1)
        done()
      })
    }, 100)

    it('does not submit a V3 request to a Ledger', done => {
      mockAccounts.current = () => ({ id: address, getAccounts: () => [address], lastSignerType: 'ledger' })

      // Ledger only supports V4+
      const params = [address, typedData]

      send({ method: 'eth_signTypedData_v3', params }, err => {
        expect(err.error.message).toMatch(/Ledger/)
        expect(err.error.code).toBe(-1)
        done()
      })
    }, 100)

    it('does not submit a V3 request to a Lattice', done => {
      mockAccounts.current = () => ({ id: address, getAccounts: () => [address], lastSignerType: 'lattice' })

      // Lattice only supports V4+
      const params = [address, typedData]

      send({ method: 'eth_signTypedData_v3', params }, err => {
        expect(err.error.message).toMatch(/Lattice/)
        expect(err.error.code).toBe(-1)
        done()
      })
    }, 100)

    it('does not submit a request to a Trezor', done => {
      mockAccounts.current = () => ({ id: address, getAccounts: () => [address], lastSignerType: 'trezor' })

      // Trezor does not support signing typed data
      const params = [address, typedData]

      send({ method: 'eth_signTypedData_v4', params }, err => {
        expect(err.error.message).toMatch(/Trezor/)
        expect(err.error.code).toBe(-1)
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

  it('allows a Fantom transaction with fees over the mainnet hard limit', done => {
    // 200 gwei * 10M gas = 2 FTM
    tx.chainId = '0xfa'
    tx.type = '0x0'
    tx.gasPrice = utils.parseUnits('210', 'gwei').toHexString()
    tx.gasLimit = addHexPrefix((1e7).toString(16))

    mockAccounts.signTransaction = () => done()

    signAndSend(err => {
      done('unexpected error :' + err.message)
    })
  })
  
  it('does not allow a pre-EIP-1559 transaction with fees that exceeds the hard limit', done => {
    // 200 gwei * 10M gas = 2 ETH
    tx.chainId = '0x1'
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
    tx.chainId = '0x1'
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
          expect(err.error.message).toBe(errorMessage)
          done()
        }

        signAndSend()

        jest.runAllTimers()
      })
    })
  })
})
