import Lattice from '../../../../../main/signers/lattice/Lattice'
import { Client } from 'gridplus-sdk'
import log from 'electron-log'
import { Derivation } from '../../../../../main/signers/Signer/derive'
import { SignTypedDataVersion } from '@metamask/eth-sig-util'

jest.mock('gridplus-sdk')

let lattice

beforeAll(() => {
  log.transports.console.level = false
  jest.useFakeTimers()
})

afterAll(() => {
  log.transports.console.level = 'debug'
  jest.useRealTimers()
})

beforeEach(() => {
  lattice = new Lattice('L8geF2', 'Gridplus-test', 'ABCXYZ')
  lattice.derivation = Derivation.standard
  lattice.on('error', jest.fn())
})

async function waitForNextPromise (fn, numPromisesInQueue = 1) {
  while (numPromisesInQueue > 0) {
    await Promise.resolve()
    numPromisesInQueue -= 1
  }

  fn()

  jest.runAllTimers()
}

describe('#connect', () => {
  const baseUrl = 'https://gridplus.io', privateKey = 'supersecretkey'

  let connectFn, pairingStatus

  beforeEach(() => {
    pairingStatus = false
    connectFn = jest.fn()

    Client.mockImplementation(opts => {
      expect(opts.name).toBe('Frame-ABCXYZ')
      expect(opts.baseUrl).toBe('https://gridplus.io')
      expect(opts.privKey).toBe('supersecretkey')

      return {
        connect: connectFn,
        getFwVersion: () => ({ major: 0, minor: 13, fix: 4 }),
        getAppName: () => 'frame-test'
      }
    })

    connectFn.mockImplementation(async deviceId => {
      if (deviceId === 'L8geF2') {
        return pairingStatus
      }

      throw new Error('connection error!')
    })
  })

  it('emits an update with connecting status', done => {
    lattice.once('update', () => {
      try {
        expect(lattice.status).toBe('connecting')
        done()
      } catch (e) { done(e) }
    })

    lattice.connect(baseUrl, privateKey)
  })

  it('connects when not paired', async () => {
    pairingStatus = false

    const paired = await lattice.connect(baseUrl, privateKey)

    expect(paired).toBe(false)
  })

  it('emits an update if not yet paired', done => {
    pairingStatus = false

    const stateFlow = []
    lattice.on('update', () => {
      stateFlow.push(lattice.status)

      if (stateFlow.length === 2) {
        try {
          expect(stateFlow[0]).toBe('connecting')
          expect(stateFlow[1]).toBe('pair')
          done()
        } catch (e) { done(e) }
      }
    })

    lattice.connect(baseUrl, privateKey)
  })

  it('emits a connect event', done => {
    pairingStatus = true

    lattice.once('connect', paired => {
      try {
        expect(paired).toBe(true)
        done()
      } catch (e) { done(e) }
    })

    lattice.connect(baseUrl, privateKey)
  })
  
  it('emits an error event when device is locked', async () => {
    connectFn.mockRejectedValue(new Error('Error from device: Device Locked'))

    const handler = new Promise((resolve, reject) => {
      lattice.once('connect', () => reject(new Error('should not be connected!')))

      lattice.once('error', () => {
        try {
          expect(lattice.status).toBe('locked')
          resolve()
        } catch (e) { reject(e) }
      })
    })
    
    try {
      await lattice.connect(baseUrl, privateKey)
      throw new Error('should have failed to connect!')
    } catch (e) {
      expect(e.message.toLowerCase()).toMatch(/device locked/)
    }

    return handler
  })
  
  it('emits an error event when device returns invalid request', async () => {
    connectFn.mockRejectedValue(new Error('Error from device: Invalid Request'))

    const handler = new Promise((resolve, reject) => {
      lattice.once('connect', () => reject('should not be connected!'))

      lattice.once('error', () => {
        try {
          expect(lattice.status.toLowerCase()).toMatch(/unknown device error/)
          resolve()
        } catch (e) { reject(e) }
      })
    })
      
    try {
      await lattice.connect(baseUrl, privateKey)
      throw new Error('should have failed to connect!')
    } catch (e) {
      expect(e.message.toLowerCase()).toMatch(/invalid request/)
    }

    return handler
  })

  it('sets the version', async () => {
    await lattice.connect(baseUrl, privateKey)

    expect(lattice.appVersion).toStrictEqual({
      major: 0,
      minor: 13,
      patch: 4
    })
  })
})

describe('#pair', () => {
  const pairingCode = 'JG7F9XS3'

  beforeEach(() => {
    lattice.connection = {
      pair: jest.fn(async code => {
        if (code === pairingCode) return true
        throw new Error('Error from device: Pairing failed')
      })
    }
  })

  it('emits an update with pairing status', done => {
    lattice.once('update', () => {
      try {
        expect(lattice.status).toBe('Pairing')
        done()
      } catch (e) { done(e) }
    })

    lattice.pair(pairingCode)
  })

  it('emits a paired event', done => {
    lattice.once('paired', hasActiveWallet => {
      try {
        expect(hasActiveWallet).toBe(true)
        done()
      } catch (e) { done(e) }
    })

    lattice.pair(pairingCode)
  })

  it('returns whether a wallet is active or not', async () => {
    lattice.connection.pair.mockResolvedValue(false)

    const hasActiveWallet = await lattice.pair(pairingCode)

    expect(hasActiveWallet).toBe(false)
  })
  
  it('emits an error event on failure', async () => {
    const handler = new Promise((resolve, reject) => {
      lattice.once('paired', () => reject('should not be paired!'))

      lattice.once('error', () => {
        try {
          expect(lattice.status.toLowerCase()).toBe('pairing failed')
          resolve()
        } catch (e) { reject(e) }
      })
    })
      
    try {
      await lattice.pair('SDFJOSJD')
      throw new Error('should have failed to connect!')
    } catch (e) {
      expect(e.message.toLowerCase()).toMatch(/pairing failed/)
    }

    return handler
  })
})

describe('#deriveAddresses', () => {
  beforeEach(() => {
    lattice.accountLimit = 5
    lattice.derivation = Derivation.standard

    lattice.connection = {
      getAppName: () => 'frame-test',
      getAddresses: jest.fn(async opts => {
        return Array(opts.n).fill().map((_, i) => `addr${opts.startPath[4] + i}`)
      })
    }
  })

  it('derives addresses using standard derivation', async () => {
    // 44'/60'/0'/0/<index>
    lattice.derivation = Derivation.standard

    await lattice.deriveAddresses()

    expect(lattice.connection.getAddresses).toHaveBeenCalledWith(
      expect.objectContaining({
        startPath: [0x80000000 + 44, 0x80000000 + 60, 0x80000000, 0, 0]
      })
    )
  })

  it('derives addresses using legacy derivation', async () => {
    // 44'/60'/0'/<index>
    lattice.derivation = Derivation.legacy
    lattice.accountLimit = 10
    lattice.addresses = ['addr1', 'addr2', 'addr3', 'addr4', 'addr5']

    await lattice.deriveAddresses()

    expect(lattice.connection.getAddresses).toHaveBeenCalledWith(
      expect.objectContaining({
        startPath: [0x80000000 + 44, 0x80000000 + 60, 0x80000000, 5]
      })
    )
  })

  it('derives addresses using live derivation', async () => {
    // 44'/60'/<index>'/0/0
    lattice.derivation = Derivation.live

    await lattice.deriveAddresses()

    const expectedIndexes = [0, 1, 2, 3, 4]

    expect(lattice.connection.getAddresses).toHaveBeenCalledTimes(expectedIndexes.length)

    expectedIndexes.forEach(n => {
      expect(lattice.connection.getAddresses).toHaveBeenNthCalledWith(n + 1,
        expect.objectContaining({
          startPath: [0x80000000 + 44, 0x80000000 + 60, 0x80000000 + n, 0, 0]
        })
      )
    })
  })

  it('emits an update with deriving status', done => {
    lattice.once('update', () => {
      try {
        expect(lattice.status).toBe('addresses')
        done()
      } catch (e) { done(e) }
    })

    lattice.deriveAddresses()
  })

  it('derives new addresses', async () => {
    await lattice.deriveAddresses()

    expect(lattice.status).toBe('ok')
    expect(lattice.addresses).toStrictEqual(
      ['0xaddr0', '0xaddr1', '0xaddr2', '0xaddr3', '0xaddr4']
    )
  })

  it('derives addresses when the limit has increased', async () => {
    lattice.addresses = [0, 1, 2, 3, 4].map(l => `addr${l}`)
    lattice.accountLimit = 10

    await lattice.deriveAddresses()

    expect(lattice.status).toBe('ok')
    expect(lattice.addresses).toStrictEqual(
      ['0xaddr0', '0xaddr1', '0xaddr2', '0xaddr3', '0xaddr4', '0xaddr5', '0xaddr6', '0xaddr7', '0xaddr8', '0xaddr9']
    )
  })

  it('derives no addresses when enough have already been derived', async () => {
    lattice.addresses = Array(10).fill().map((_, i) => `addr${i + 10}`)
    lattice.accountLimit = 5

    await lattice.deriveAddresses()

    expect(lattice.connection.getAddresses).not.toHaveBeenCalled()
    expect(lattice.addresses.length).toBe(10)
  })
  
  it('retries on failure', done => {
    let requestNum = 0

    lattice.connection.getAddresses.mockImplementation(async opts => {
      if ((requestNum += 1) === 1) {
        throw new Error('Error from device: Getting addresses failed')
      }
      return ['addr1', 'addr2', 'addr3', 'addr4', 'addr5']
    })

    lattice.once('error', () => done('should not emit an error!'))
    lattice.on('update', () => {
      if (lattice.status === 'ok') {
        try {
          expect(lattice.addresses).toHaveLength(5)
          done()
        } catch (e) { done(e) }
      }
    })
      
    lattice.deriveAddresses()

    waitForNextPromise(() => jest.advanceTimersByTime(3000), 3)
  })
  
  it('emits an error event on failure', done => {
    lattice.connection.getAddresses.mockImplementation(async () => {
      throw new Error('Error from device: Getting addresses failed')
    })

    lattice.on('update', () => {
      if (lattice.status === 'ok') done('should not have derived!')
    })

    lattice.once('error', () => {
      try {
        expect(lattice.addresses).toHaveLength(0)
        expect(lattice.status.toLowerCase()).toMatch(/error/)
        done()
      } catch (e) { done(e) }
    })
      
    lattice.deriveAddresses(Derivation.standard, 0)
  })
})

describe('#verifyAddress', () => {
  beforeEach(() => {
    lattice.addresses = ['addr1', 'addr2', 'addr3', 'addr4', 'addr5']
    lattice.accountLimit = 5
    lattice.connection = { getAddresses: jest.fn(), getAppName: () => 'frame-test' }
  })

  it('verifies a matching address', done => {
    lattice.verifyAddress(2, 'addr3', false, (err, result) => {
      try {
        expect(err).toBe(null)
        expect(result).toBe(true)
        done()
      } catch (e) { done(e) }
    })
  })

  it('identifies a non-matching address', done => {
    lattice.verifyAddress(2, 'addrX', false, (err, result) => {
      try {
        expect(err.message.toLowerCase()).toBe('address does not match device')
        expect(result).toBe(undefined)
        done()
      } catch (e) { done(e) }
    })
  })

  it('fails if deriving addresses fails', done => {
    lattice.addresses = []
    lattice.connection.getAddresses = async () => { throw new Error('error!') }

    lattice.verifyAddress(2, 'addr3', false, (err, result) => {
      try {
        expect(err.message.toLowerCase()).toBe('verify address error')
        expect(result).toBe(undefined)
        done()
      } catch (e) { done(e) }
    })
  })
})

describe('#signMessage', () => {
  beforeEach(() => {
    lattice.connection = {
      sign: jest.fn(async opts => {
        if (
          opts.currency === 'ETH_MSG' &&
          opts.data.protocol === 'signPersonal' &&
          opts.data.payload &&
          opts.data.signerPath[4] === 4) {
          return {
            sig: {
              r: '9af6cb',
              s: 'abcd04',
              v: Buffer.from('01', 'hex')
            }
          }
        }

        throw new Error('invalid message!')
      })
    }
  })

  it('signs a valid message', done => {
    lattice.signMessage(4, 'sign this please', (err, res) => {
      try {
        expect(err).toBe(null)
        expect(res).toBe('0x9af6cbabcd0401')
        done()
      } catch (e) { done(e) }
    })
  })

  it('returns an error on failure', done => {
    // wrong index, mock function expects 4, not 3
    lattice.signMessage(3, 'sign this please', (err, res) => {
      try {
        expect(err).toBeTruthy()
        expect(res).toBe(undefined)
        done()
      } catch (e) { done(e) }
    })
  })
})

describe('#signTypedData', () => {
  beforeEach(() => {
    lattice.connection = {
      sign: jest.fn(async opts => {
        if (
          opts.currency === 'ETH_MSG' &&
          opts.data.protocol === 'eip712' &&
          opts.data.payload &&
          opts.data.signerPath[4] === 2) {
          return {
            sig: {
              r: '3ea8cd',
              s: 'abcd04',
              v: Buffer.from('01', 'hex')
            }
          }
        }

        throw new Error('invalid message!')
      })
    }
  })

  it('signs a valid typed data message', done => {
    lattice.signTypedData(2, { version: SignTypedDataVersion.V4, data: 'typed data' }, (err, res) => {
      try {
        expect(err).toBe(null)
        expect(res).toBe('0x3ea8cdabcd0401')
        done()
      } catch (e) { done(e) }
    })
  })

  it('returns an error on failure', done => {
    // wrong index, mock function expects 2, not 3
    lattice.signTypedData(3, { version: SignTypedDataVersion.V4, data: 'typed data' }, (err, res) => {
      try {
        expect(err).toBeTruthy()
        expect(res).toBe(undefined)
        done()
      } catch (e) { done(e) }
    })
  })
})

describe('#signTransaction', () => {
  const tx = {
    chainId: '0x89'
  }

  const expectedSignature = {
    sig: {
      r: Buffer.from('3ea8cd', 'hex'),
      s: Buffer.from('96f7a0', 'hex'),
      v: Buffer.from('00', 'hex')
    }
  }

  beforeEach(() => {
    lattice.appVersion = { major: 1, minor: 1, patch: 0 }
    lattice.connection = { sign: jest.fn(), getFwVersion: async () => ({ major: 1, minor: 3, fix: 5 }) }
  })

  it('signs a legacy transaction', done => {
    // Lattice expects the type to be undefined for legacy transactions,
    // sending a type of zero if EIP-1559 is enabled will cause an error
    const txToSign = { ...tx, type: '0x0' }

    lattice.connection.sign.mockImplementation(async opts => {
      try {
        expect(opts.currency).toBe('ETH')
        expect(opts.data.type).toBe(undefined)
        expect(opts.data.signerPath[4]).toBe(4)
        expect(parseInt(opts.data.chainId)).toBe(137)

        return {
          sig: {
            ...expectedSignature.sig,
            v: Buffer.from('1b', 'hex')
          }
        }
      } catch (e) { done(e) }
    })

    lattice.signTransaction(4, txToSign, (err, res) => {
      try {
        expect(err).toBe(null)
        expect(res).toBe('0xcf8080808080801b833ea8cd8396f7a0')
        done()
      } catch (e) { done(e) }
    })
  })

  it('signs a post eip-1559 transaction', done => {
    const txToSign = { ...tx, type: '0x2' }

    lattice.connection.sign.mockImplementation(async opts => {
      try {
        expect(opts.currency).toBe('ETH')
        expect(opts.data.type).toBe(2)
        expect(opts.data.signerPath[4]).toBe(4)
        expect(parseInt(opts.data.chainId)).toBe(137)

        return expectedSignature
      } catch (e) { done(e) }
    })

    lattice.signTransaction(4, txToSign, (err, res) => {
      try {
        expect(err).toBe(null)
        expect(res).toBe('0x02d3818980808080808080c080833ea8cd8396f7a0')
        done()
      } catch (e) { done(e) }
    })
  })
})

describe('#disconnect', () => {
  it('emits an update if Lattice was connected', () => {
    lattice.status = 'ok'

    const updateHandler = jest.fn()
    lattice.once('update', updateHandler)

    lattice.disconnect()

    expect(lattice.status).toBe('disconnected')
    expect(updateHandler).toHaveBeenCalled()
  })

  it('does not change an error status', () => {
    lattice.status = 'some error'

    const updateHandler = jest.fn()
    lattice.once('update', updateHandler)

    lattice.disconnect()

    expect(lattice.status).toBe('some error')
    expect(updateHandler).not.toHaveBeenCalled()
  })

  it('removes the connection', () => {
    lattice.connection = 'a connection'

    lattice.disconnect()

    expect(lattice.connection).toBeFalsy()
  })

  it('clears addresses', () => {
    lattice.addresses = ['addr1', 'addr2', 'etc']

    lattice.disconnect()

    expect(lattice.addresses).toHaveLength(0)
  })
})

describe('#close', () => {
  it('emits a close event', () => {
    const updateHandler = jest.fn()
    lattice.once('close', updateHandler)

    lattice.close()

    expect(updateHandler).toHaveBeenCalled()
  })

  it('removes all listeners', () => {
    lattice.on('close', jest.fn())

    lattice.close()

    expect(lattice.listenerCount('close')).toBe(0)
  })

  it('disconnects', () => {
    lattice.connection = 'a connection'

    lattice.close()
    
    expect(lattice.connection).toBeFalsy()
  })
})

describe('#summary', () => {
  it('only returns addresses up to the address limit', () => {
    lattice.addresses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    lattice.accountLimit = 5

    expect(lattice.summary().addresses).toHaveLength(5)
  })
})
