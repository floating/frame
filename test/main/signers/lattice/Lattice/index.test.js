import Lattice from '../../../../../main/signers/lattice/Lattice'
import { Client } from 'gridplus-sdk'
import log from 'electron-log'

jest.mock('gridplus-sdk')

let lattice

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

beforeEach(() => {
  lattice = new Lattice('L8geF2', 'Frame-test-lattice')
})

describe('#connect', () => {
  const baseUrl = 'https://gridplus.io', privateKey = 'supersecretkey'

  let connectFn, pairingStatus

  beforeEach(() => {
    pairingStatus = false
    connectFn = jest.fn()

    Client.mockImplementation(opts => {
      if (
        opts.name === 'Frame-test-lattice' &&
        opts.baseUrl === 'https://gridplus.io' &&
        opts.privKey === 'supersecretkey'
      ) {
        return {
          connect: connectFn,
          fwVersion: [4, 13, 0]
        }
      }
    })

    connectFn.mockImplementation((deviceId, cb) => {
      if (deviceId === 'L8geF2') {
        return cb(null, pairingStatus)
      }

      cb('connection error!')
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
    connectFn.mockImplementation((_, cb) => cb('Error from device: Device Locked'))

    const handler = new Promise((resolve, reject) => {
      lattice.once('connect', () => reject('should not be connected!'))

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
    connectFn.mockImplementation((_, cb) => cb('Error from device: Invalid Request'))

    const handler = new Promise((resolve, reject) => {
      lattice.once('connect', () => reject('should not be connected!'))

      lattice.once('error', () => {
        try {
          expect(lattice.status).toBe('Unknown Error')
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
      pair: jest.fn((code, cb) => {
        if (code === pairingCode) return cb(null, true)
        cb('Error from device: Pairing failed')
      })
    }
  })

  it('does not attempt to pair if Lattice is disconnected', async () => {
    lattice.connection = null

    try {
      await lattice.pair(pairingCode)
      throw new Error('should not connect!')
    } catch (e) {
      expect(e.message).toMatch(/disconnected/)
      expect(lattice.status).not.toBe('Pairing')
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
    lattice.connection.pair.mockImplementation((_, cb) => cb(null, false))

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
