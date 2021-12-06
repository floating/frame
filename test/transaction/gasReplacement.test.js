import accounts from '../../main/accounts'
import chainConfig from '../../main/chains/config'

import EventEmitter from 'events'
import { addHexPrefix } from 'ethereumjs-util'
import log from 'electron-log'

const weiToHex = wei => addHexPrefix(wei.toString(16))
const gweiToHex = gwei => weiToHex(gwei * 1e9)

class MockConnection extends EventEmitter {
  constructor () {
    super()

    this.syncDataEmit = jest.fn()
    this.send = jest.fn()
  }
}

const address = '0x22dd63c3619818fdbc262c78baee43cb61e9cccf'

const mockStore = {}
let provider, mockConnection, accountRequests = []

const retx = {
  jsonrpc: '2.0',
  id: 7,
  method: 'eth_sendTransaction',
  params: [{
    from: '0x22dd63c3619818fdbc262c78baee43cb61e9cccf',
    to: '0x22dd63c3619818fdbc262c78baee43cb61e9cccf',
    chainId: '0x1',
    gasLimit: weiToHex(21000),
    type: '0x1',
    nonce: '0xa'
  }]
}

jest.mock('../../main/chains', () => mockConnection)
jest.mock('../../main/accounts', () => ({}))

jest.mock('../../main/store', () => {
  const store = (...args) => mockStore[args.join('.')]

  store.updateAccount = () => {}
  store.observer = () => {}
  return store
})

beforeAll(async () => {
  log.transports.console.level = false

  mockConnection = new MockConnection()

  // need to import this after mocks are set up
  provider = (await import('../../main/provider')).default

  accounts.getAccounts = () => [address]

  mockStore['main.accounts.0x22dd63c3619818fdbc262c78baee43cb61e9cccf.requests'] = {}

  accounts.addRequest = (req, res) => {
    mockStore['main.accounts.0x22dd63c3619818fdbc262c78baee43cb61e9cccf.requests'][req.handlerId] = req
    accountRequests.push(req)
    if (res) res()
  }
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

beforeEach(() => {
  provider.handlers = {}
  accountRequests = []

  accounts.current = jest.fn(() => ({ 
    id: address, 
    getAccounts: () => [address],
    getSelectedAddress: () => address
  }))
  accounts.signTransaction = jest.fn()
  accounts.setTxSigned = jest.fn()

  mockStore['main.networksMeta.ethereum.1.gas'] ={
    price: {
      selected: 'standard',
      levels: { slow: '', standard: '', fast: gweiToHex(30), asap: '', custom: '' },
      fees: {
        maxPriorityFeePerGas: gweiToHex(1),
        maxBaseFeePerGas: gweiToHex(8)
      }
    }
  }

  mockStore['main.accounts.0x22dd63c3619818fdbc262c78baee43cb61e9cccf.requests'] = {}
  mockStore['main.currentNetwork'] = { type: 'ethereum', id: 1 }
  mockStore['main.networks.ethereum.1'] = { id: 1 },
  mockStore['main.networks.ethereum.4'] = { id: 4 }
  mockStore['main.tokens'] = []
})

describe('Add margins to replacement transactions', () => {
  it('creates replacement type 2 tx, adds 10% gas buffer', (done) => {
    try {
      mockConnection.connections = {
        ethereum: {
          1: {
            chainConfig: chainConfig(1, 'london')
          }
        }
      }
  
      provider.send(retx, () => {
        const initialRequest = accountRequests[0]
        const initalTip = initialRequest.data.maxPriorityFeePerGas
        const initialMax = initialRequest.data.maxFeePerGas

        expect(initalTip).toBe(gweiToHex(1))
        expect(initialMax).toBe(gweiToHex(9))
        expect(initialRequest.feesUpdatedByUser).toBeFalsy()
        
        mockStore['main.accounts.0x22dd63c3619818fdbc262c78baee43cb61e9cccf.requests'][initialRequest.handlerId].mode = 'monitor'

        provider.send(retx, () => {
          const replacementRequest = accountRequests[1]
          const bumpedFee = Math.ceil(initalTip * 1.1)
          const bumpedBase = Math.ceil((initialMax - initalTip) * 1.1)
          const bumpedMax = bumpedFee + bumpedBase

          expect(replacementRequest.data.maxPriorityFeePerGas).toBe(weiToHex(bumpedFee))
          expect(replacementRequest.data.maxFeePerGas).toBe(weiToHex(bumpedMax))
          expect(replacementRequest.feesUpdatedByUser).toBe(true)
          done()
        })
      })
    } catch (e) {
     throw e 
    }
  })

  it('creates replacement type 2 tx, lets current gas take precedence if over buffer', (done) => {
    try {
      mockConnection.connections = {
        ethereum: {
          1: {
            chainConfig: chainConfig(1, 'london')
          }
        }
      }
  
      provider.send(retx, () => {
        const initialRequest = accountRequests[0]
        const initalTip = initialRequest.data.maxPriorityFeePerGas
        const initialMax = initialRequest.data.maxFeePerGas

        expect(initalTip).toBe(gweiToHex(1))
        expect(initialMax).toBe(gweiToHex(9))
        expect(initialRequest.feesUpdatedByUser).toBeFalsy()

        mockStore['main.accounts.0x22dd63c3619818fdbc262c78baee43cb61e9cccf.requests'][initialRequest.handlerId].mode = 'monitor'
        mockStore['main.networksMeta.ethereum.1.gas'] = {
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: gweiToHex(40), asap: '', custom: '' },
            fees: {
              maxPriorityFeePerGas: gweiToHex(2),
              maxBaseFeePerGas: gweiToHex(14)
            }
          }
        }

        provider.send(retx, () => {
          const replacementRequest = accountRequests[1]

          expect(replacementRequest.data.maxPriorityFeePerGas).toBe(gweiToHex(2))
          expect(replacementRequest.data.maxFeePerGas).toBe(gweiToHex(16))
          expect(replacementRequest.feesUpdatedByUser).toBeFalsy()
          done()
        })
      })
    } catch (e) {
     throw e 
    }
  })

  it('creates replacement type 2 tx, lets only current gas base take precedence if over buffer', (done) => {
    try {
      mockConnection.connections = {
        ethereum: {
          1: {
            chainConfig: chainConfig(1, 'london')
          }
        }
      }
  
      provider.send(retx, () => {
        const initialRequest = accountRequests[0]
        const initalTip = initialRequest.data.maxPriorityFeePerGas
        const initialMax = initialRequest.data.maxFeePerGas

        expect(initalTip).toBe(gweiToHex(1))
        expect(initialMax).toBe(gweiToHex(9))
        expect(initialRequest.feesUpdatedByUser).toBeFalsy()

        mockStore['main.accounts.0x22dd63c3619818fdbc262c78baee43cb61e9cccf.requests'][initialRequest.handlerId].mode = 'monitor'
        mockStore['main.networksMeta.ethereum.1.gas'] = {
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: gweiToHex(40), asap: '', custom: '' },
            fees: {
              maxPriorityFeePerGas: gweiToHex(1),
              maxBaseFeePerGas: gweiToHex(20)
            }
          }
        }

        provider.send(retx, () => {
          const replacementRequest = accountRequests[1]
          const bumpedFee = Math.ceil(initalTip * 1.1)
          expect(replacementRequest.data.maxPriorityFeePerGas).toBe(weiToHex(bumpedFee))
          expect(replacementRequest.data.maxFeePerGas).toBe(weiToHex((20 * 1e9) + bumpedFee))
          expect(replacementRequest.feesUpdatedByUser).toBe(true)
          done()
        })
      })
    } catch (e) {
     throw e 
    }
  })

  it('creates replacement type 1 tx, adds 10% gas buffer', (done) => {
    try {
      mockConnection.connections = {
        ethereum: {
          1: {
            chainConfig: chainConfig(400)
          }
        }
      } 
  
      provider.send(retx, () => {
        const initialRequest = accountRequests[0]
        const initalPrice = initialRequest.data.gasPrice

        expect(initalPrice).toBe(gweiToHex(30))
        expect(initialRequest.feesUpdatedByUser).toBeFalsy()

        mockStore['main.accounts.0x22dd63c3619818fdbc262c78baee43cb61e9cccf.requests'][initialRequest.handlerId].mode = 'monitor'

        provider.send(retx, () => {
          const replacementRequest = accountRequests[1]
          const bumpedPrice = Math.ceil(initalPrice * 1.1)
          expect(replacementRequest.data.gasPrice).toBe(weiToHex(bumpedPrice))
          expect(replacementRequest.feesUpdatedByUser).toBe(true)
          done()
        })
      })
    } catch (e) {
     throw e 
    }
  })

  it('creates replacement type 1 tx, lets current gasPrice take precedence if over buffer', (done) => {
    try {
      mockConnection.connections = {
        ethereum: {
          1: {
            chainConfig: chainConfig(400)
          }
        }
      } 
  
      provider.send(retx, () => {
        const initialRequest = accountRequests[0]
        const initalPrice = initialRequest.data.gasPrice

        expect(initalPrice).toBe(gweiToHex(30))
        expect(initialRequest.feesUpdatedByUser).toBeFalsy()

        mockStore['main.accounts.0x22dd63c3619818fdbc262c78baee43cb61e9cccf.requests'][initialRequest.handlerId].mode = 'monitor'

        mockStore['main.networksMeta.ethereum.1.gas'] = {
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: gweiToHex(40), asap: '', custom: '' },
            fees: {
              maxPriorityFeePerGas: gweiToHex(1),
              maxBaseFeePerGas: gweiToHex(8)
            }
          }
        }
        
        provider.send(retx, () => {
          const replacementRequest = accountRequests[1]
          expect(replacementRequest.data.gasPrice).toBe(gweiToHex(40))
          expect(replacementRequest.feesUpdatedByUser).toBeFalsy()
          done()
        })
      })
    } catch (e) {
     throw e 
    }
  })
})
