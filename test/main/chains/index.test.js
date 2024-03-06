import log from 'electron-log'
import EventEmitter from 'events'
import { addHexPrefix, intToHex } from '@ethereumjs/util'

import store from '../../../main/store'
import { gweiToHex } from '../../util'

log.transports.console.level = false

jest.mock('electron', () => ({
  powerMonitor: {
    on: jest.fn()
  }
}))

class MockConnection extends EventEmitter {
  constructor(chainId) {
    super()

    this.connected = false

    this.connect = () => {
      if (!this.connected) {
        this.connected = true
        process.nextTick(() => this.emit('connect'))
      }
    }

    this.close = () => {
      if (this.connected) {
        this.connected = false
        this.emit('close')
      }
    }

    this.send = (payload) => {
      return new Promise((resolve, reject) => {
        if (payload.method === 'eth_getBlockByNumber') {
          return resolve(block)
        } else if (payload.method === 'eth_gasPrice') {
          return resolve(gasPrice)
        } else if (payload.method === 'eth_feeHistory') {
          return resolve({
            baseFeePerGas: [gweiToHex(15), gweiToHex(8), gweiToHex(9), gweiToHex(8), gweiToHex(7)],
            gasUsedRatio: [0.11, 0.8, 0.2, 0.5],
            reward: [[gweiToHex(32)], [gweiToHex(32)], [gweiToHex(32)], [gweiToHex(32)]]
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

let block, gasPrice, observer, connectionObserver

const state = {
  main: {
    currentNetwork: {
      type: 'ethereum',
      id: '11155111'
    },
    networks: {
      ethereum: {
        11155111: {
          id: 11155111,
          type: 'ethereum',
          name: 'Sepolia',
          connection: {
            primary: {
              on: false,
              current: 'pylon',
              status: 'loading',
              connected: false,
              type: '',
              network: '',
              custom: ''
            },
            secondary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              type: '',
              network: '',
              custom: ''
            }
          },
          on: true
        },
        137: {
          id: 137,
          type: 'ethereum',
          name: 'Polygon',
          connection: {
            primary: {
              on: false,
              current: 'pylon',
              status: 'loading',
              connected: false,
              type: '',
              network: '',
              custom: ''
            },
            secondary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              type: '',
              network: '',
              custom: ''
            }
          },
          on: true
        }
      }
    },
    networksMeta: {
      ethereum: {
        11155111: {
          gas: {
            price: {
              selected: 'standard',
              levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
            }
          }
        },
        137: {
          gas: {
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

jest.mock('eth-provider', () => (target) => mockConnections[target].connection)
jest.mock('../../../main/store/state', () => () => state)
jest.mock('../../../main/accounts', () => ({ updatePendingFees: jest.fn() }))
jest.mock('../../../main/store/persist')

const mockConnections = {
  'wss://evm.pylon.link/sepolia': {
    id: '11155111',
    name: 'sepolia',
    connection: new MockConnection(5)
  },
  'wss://evm.pylon.link/polygon': {
    id: '137',
    name: 'polygon',
    connection: new MockConnection(137)
  }
}

let chains

beforeAll(async () => {
  jest.useRealTimers()

  // need to import this after mocks are set up
  chains = (await import('../../../main/chains')).default
})

beforeEach(() => {
  block = {}

  connectionObserver = store.observer(() => {
    Object.values(mockConnections).forEach((chain) => {
      const primary = store(`main.networks.ethereum.${chain.id}.connection.primary`)

      if (primary.on) {
        chain.connection.connect()
      }
    })
  })

  Object.values(mockConnections).forEach((chain) => {
    store.setGasPrices('ethereum', chain.id, {})
    store.setGasFees('ethereum', chain.id, {})
  })
})

afterEach((done) => {
  if (observer) {
    observer.remove()
  }

  if (connectionObserver) {
    connectionObserver.remove()
  }

  const activeConnection = Object.values(mockConnections).find((conn) => conn.connection.connected)

  chains.once('close', ({ id }) => {
    if (id === activeConnection.id) {
      done()
    } else {
      done.fail('connection error')
    }
  })

  store.toggleConnection('ethereum', activeConnection.id, 'primary', false)
})

Object.values(mockConnections).forEach((chain) => {
  it(`sets legacy gas prices on a new non-London block on ${chain.name}`, (done) => {
    gasPrice = gweiToHex(6)
    block = {
      number: addHexPrefix((8897988 - 20).toString(16))
    }

    observer = store.observer(() => {
      const gas = store(`main.networksMeta.ethereum.${chain.id}.gas.price.levels`)

      if (gas.fast) {
        expect(gas.fast).toBe(gweiToHex(6))

        done()
      }
    })

    store.toggleConnection('ethereum', chain.id, 'primary', true)
  })

  it(`sets fee market prices on a new London block on ${chain.name}`, (done) => {
    block = {
      number: addHexPrefix((12965200).toString(16)),
      baseFeePerGas: gweiToHex(9)
    }

    const expectedBaseFee = 7e9 * 1.125 * 1.125
    const expectedPriorityFee = 32e9

    observer = store.observer(() => {
      const gas = store(`main.networksMeta.ethereum.${chain.id}.gas.price`)

      if (gas.fees.maxBaseFeePerGas) {
        expect(gas.fees.maxBaseFeePerGas).toBe(intToHex(expectedBaseFee))
        expect(gas.fees.maxPriorityFeePerGas).toBe(intToHex(expectedPriorityFee))
        expect(gas.fees.maxFeePerGas).toBe(intToHex(expectedBaseFee + expectedPriorityFee))

        expect(gas.selected).toBe('fast')
        expect(gas.levels.fast).toBe(intToHex(expectedBaseFee + expectedPriorityFee))

        done()
      }
    })

    store.toggleConnection('ethereum', chain.id, 'primary', true)
  })
})
