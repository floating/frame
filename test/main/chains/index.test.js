import EventEmitter from 'events'
import { addHexPrefix } from 'ethereumjs-util'
import log from 'electron-log'

import store from '../../../main/store'
import { gweiToHex, weiToHex } from '../../util'

log.transports.console.level = false

class MockConnection extends EventEmitter {
  constructor (chainId) {
    super()

    this.send = payload => {
      return new Promise((resolve, reject) => {
        if (payload.method === 'eth_getBlockByNumber') {
          return resolve(block)
        } else if (payload.method === 'eth_gasPrice') {
          return resolve(gasPrice)
        } else if (payload.method === 'eth_feeHistory') {
          return resolve({
            baseFeePerGas: [gweiToHex(15), gweiToHex(8), gweiToHex(9), gweiToHex(8), gweiToHex(7)],
            gasUsedRatio: [0.11, 0.8, 0.2, 0.5],
            reward: [
              [gweiToHex(1), gweiToHex(1), gweiToHex(1), gweiToHex(1),]
            ]
          })
        }

        return reject('unknown method!')
      })
    }

    this.sendAsync = (payload, cb) => {
      if (payload.method === 'eth_chainId') return cb(null, { result: addHexPrefix(chainId.toString(16)) })
      return cb('unknown method!')
    }
  }
}

let block, gasPrice, observer
const mockConnection = new MockConnection(4)
const state = {
  main: {
    currentNetwork: {
      type: 'ethereum',
      id: '4'
    },
    networkPresets: {
      ethereum: {
        default: {
          local: 'direct'
        },
        4: {
          infura: 'infuraRinkeby'
        }
      }
    },
    networks: { 
      ethereum: {
        4: {
          id: 4,
          type: 'ethereum',
          layer: 'testnet',
          symbol: 'ETH',
          name: 'Rinkeby',
          explorer: 'https://rinkeby.etherscan.io',
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          },
          connection: {
            primary: { on: true, current: 'infura', status: 'loading', connected: false, type: '', network: '', custom: '' },
            secondary: { on: false, current: 'custom', status: 'loading', connected: false, type: '', network: '', custom: '' }
          },
          on: true
        }
      }
    },
    networksMeta: {
      ethereum: {
        4: {
          gas: {
            fees: {},
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          }
        }
      }
    }
  }
}

jest.mock('eth-provider', () => () => mockConnection)
jest.mock('../../../main/store/state', () => () => state)
jest.mock('../../../main/accounts', () => ({ updatePendingFees: jest.fn() }))
jest.mock('../../../main/store/persist', () => ({
  get: jest.fn(),
  set: jest.fn()
}))


let Chains 
beforeAll(async () => {
  // need to import this after mocks are set up
  Chains = (await import('../../../main/chains')).default
})

beforeEach(() => {
  block = {}
  store.setGasPrices('ethereum', '4', {})
  store.setGasFees('ethereum', '4', {})
})

afterEach(() => {
  if (observer) {
    observer.remove()
  }
  
  mockConnection.emit('close')
})

it('sets legacy gas prices on a new non-London block', done => {
  gasPrice = gweiToHex(6)
  block = {
    number: addHexPrefix((8897988 - 20).toString(16)) // london block: 8897988
  }

  observer = store.observer(() => {
    const gas = store('main.networksMeta.ethereum.4.gas.price.levels')
    if (gas.fast) {
      expect(gas.fast).toBe(gweiToHex(6))

      done()
    }
  })

  mockConnection.emit('connect')
})

it('sets fee market prices on a new London block', done => {
  block = {
    number: addHexPrefix((8897988 + 200).toString(16)), // london block: 8897988
    baseFeePerGas: gweiToHex(9)
  }

  const expectedBaseFee = 7e9 * 1.125 * 1.125
  const expectedPriorityFee = 1e9

  observer = store.observer(() => {
    const gas = store('main.networksMeta.ethereum.4.gas.price')
    if (gas.fees.maxBaseFeePerGas) {
      expect(gas.fees.maxBaseFeePerGas).toBe(weiToHex(expectedBaseFee))
      expect(gas.fees.maxPriorityFeePerGas).toBe(weiToHex(expectedPriorityFee))
      expect(gas.fees.maxFeePerGas).toBe(weiToHex(expectedBaseFee + expectedPriorityFee))

      expect(gas.selected).toBe('fast')
      expect(gas.levels.fast).toBe(weiToHex((expectedBaseFee * 1.05) + expectedPriorityFee))

      done()
    }
  })

  mockConnection.emit('connect')
})
