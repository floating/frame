import EventEmitter from 'events'
import { utils } from 'ethers'
import { addHexPrefix } from 'ethereumjs-util'
import log from 'electron-log'

log.transports.console.level = false

const mockAccounts = {}
const mockStore = {
  'main.accounts': {
    "0x22dd63c3619818fdbc262c78baee43cb61e9cccf": {}
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
  const store = k => mockStore[k]

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
