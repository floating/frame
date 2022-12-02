import log from 'electron-log'
import { EventEmitter } from 'stream'

import LatticeSignerAdapter from '../../../../main/signers/lattice/adapter'
import Lattice from '../../../../main/signers/lattice/Lattice'

import store from '../../../../main/store'

jest.mock('../../../../main/store')
jest.mock('../../../../main/signers/lattice/Lattice')

let adapter

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

beforeEach(() => {
  store.set('main.lattice', 'NBaJ8e', {
    deviceName: 'Frame-testlattice',
    privKey: 'supersecretkey',
    paired: true
  })

  store.set('main.latticeSettings', {
    derivation: 'legacy'
  })

  adapter = new LatticeSignerAdapter()
})

afterEach(() => {
  store.clear()
})

it('has the correct adapter type', () => {
  const adapter = new LatticeSignerAdapter()
  expect(adapter.adapterType).toBe('lattice')
})

describe('#open', () => {
  it('adds the settings observer', () => {
    adapter.open()

    expect(adapter.settingsObserver).toBeTruthy()
  })

  it('adds the signer observer', () => {
    adapter.open()

    expect(adapter.signerObserver).toBeTruthy()
  })
})

describe('#close', () => {
  beforeEach(() => {
    adapter.open()
  })

  it('removes the settings observer', () => {
    adapter.close()

    expect(adapter.settingsObserver).toBe(null)
    expect(store.getObserver('latticeSettings')).toBe(undefined)
  })

  it('removes the signer observer', () => {
    adapter.close()

    expect(adapter.signerObserver).toBe(null)
    expect(store.getObserver('latticeSigners')).toBe(undefined)
  })
})

describe('#remove', () => {
  const latticeSigner = { deviceId: 'M8jl93' }

  beforeEach(() => {
    store.removeLattice = jest.fn()
    latticeSigner.close = jest.fn()
  })

  it('removes a Lattice device from the store', () => {
    adapter.remove(latticeSigner)

    expect(store.removeLattice).toHaveBeenCalledWith('M8jl93')
  })

  it('closes a known Lattice signer', () => {
    adapter.knownSigners['M8jl93'] = { deviceName: 'existing-frame-lattice' }

    adapter.remove(latticeSigner)

    expect(latticeSigner.close).toHaveBeenCalled()
  })

  it('does not attempt to close an unknown Lattice signer', () => {
    adapter.knownSigners['G6s8sa'] = { deviceName: 'existing-frame-lattice' }
    adapter.remove(latticeSigner)

    expect(latticeSigner.close).not.toHaveBeenCalled()
  })
})

describe('#reload', () => {
  const latticeSigner = { deviceId: 'NBaJ8e' }

  beforeEach(() => {
    latticeSigner.connect = jest.fn()
    latticeSigner.disconnect = jest.fn()
  })

  it('disconnects the Lattice signer', () => {
    adapter.reload(latticeSigner)

    expect(latticeSigner.disconnect).toHaveBeenCalled()
  })

  it('connects the Lattice signer with the correct settings', () => {
    adapter.reload(latticeSigner)

    expect(latticeSigner.connect).toHaveBeenCalledWith('https://signing.gridpl.us', 'supersecretkey')
  })
})

describe('settings changes', () => {
  const latticeSigner = {
    deviceId: 'NBaJ8e'
  }

  let settingsObserver

  beforeEach(() => {
    latticeSigner.connect = jest.fn()
    latticeSigner.disconnect = jest.fn()
    latticeSigner.deriveAddresses = jest.fn()
    latticeSigner.update = jest.fn()

    latticeSigner.addresses = Array(5).fill('addr')
    latticeSigner.connection = {
      baseUrl: 'https://signing.gridpl.us'
    }

    adapter.knownSigners['NBaJ8e'] = latticeSigner
    adapter.open()

    settingsObserver = store.getObserver('latticeSettings')
  })

  it('does not attempt to reload a Lattice with no connection', () => {
    delete latticeSigner.connection

    store.set('main.latticeSettings', { endpointMode: 'custom', endpointCustom: 'https://myendpoint.io' })

    settingsObserver.fire()

    expect(latticeSigner.disconnect).not.toHaveBeenCalled()
    expect(latticeSigner.connect).not.toHaveBeenCalled()
  })

  it('does not attempt to reload a Lattice if the relay URL has not changed', () => {
    store.set('main.latticeSettings', { endpointMode: 'custom', endpointCustom: 'https://signing.gridpl.us' })

    settingsObserver.fire()

    expect(latticeSigner.disconnect).not.toHaveBeenCalled()
    expect(latticeSigner.connect).not.toHaveBeenCalled()
  })

  it('reloads a connected Lattice if the relay URL is changed to custom', () => {
    store.set('main.latticeSettings', { endpointMode: 'custom', endpointCustom: 'https://myendpoint.io' })

    settingsObserver.fire()

    expect(latticeSigner.disconnect).toHaveBeenCalled()
    expect(latticeSigner.connect).toHaveBeenCalledWith('https://myendpoint.io', 'supersecretkey')
  })

  it('reloads a connected Lattice if the relay URL is changed back to the default', () => {
    latticeSigner.connection = {
      baseUrl: 'https://customendpoint.io'
    }

    store.set('main.latticeSettings', {
      endpointMode: 'standard',
      endpointCustom: 'https://customendpoint.io'
    })

    settingsObserver.fire()

    expect(latticeSigner.disconnect).toHaveBeenCalled()
    expect(latticeSigner.connect).toHaveBeenCalledWith('https://signing.gridpl.us', 'supersecretkey')
  })

  it('derives addresses if the account limit has increased above the number of addresses', () => {
    latticeSigner.accountLimit = 5

    store.set('main.latticeSettings.accountLimit', 10)

    settingsObserver.fire()

    expect(latticeSigner.deriveAddresses).toHaveBeenCalled()
  })

  it('updates if the number of displayed addresses has changed but none need to be derived', () => {
    latticeSigner.accountLimit = 10

    store.set('main.latticeSettings.accountLimit', 5)

    const updateHandler = jest.fn()
    adapter.once('update', updateHandler)

    settingsObserver.fire()

    expect(latticeSigner.deriveAddresses).not.toHaveBeenCalled()
    expect(updateHandler).toHaveBeenCalled()
  })

  it('derives addresses if the derivation changed', () => {
    store.set('main.latticeSettings.derivation', 'standard')

    settingsObserver.fire()

    expect(latticeSigner.deriveAddresses).toHaveBeenCalled()
  })
})

describe('signer device changes', () => {
  let latticeSigner, signerObserver

  beforeEach(() => {
    store.updateLattice = jest.fn()

    latticeSigner = new EventEmitter()
    latticeSigner.connect = jest.fn(() => Promise.resolve())
    latticeSigner.disconnect = jest.fn()
    latticeSigner.deriveAddresses = jest.fn()

    Lattice.mockImplementation((deviceId, deviceName) => {
      latticeSigner.deviceId = deviceId
      latticeSigner.deviceName = deviceName
      latticeSigner.id = 'lattice-' + deviceId
      return latticeSigner
    })

    adapter.open()
    signerObserver = store.getObserver('latticeSigners')
  })

  describe('detecting a new Lattice', () => {
    it('creates a new signer', (done) => {
      adapter.once('add', (lattice) => {
        try {
          expect(Object.keys(adapter.knownSigners)).toHaveLength(1)
          expect(adapter.knownSigners['NBaJ8e']).toBeTruthy()
          expect(lattice.deviceId).toBe('NBaJ8e')
          expect(lattice.deviceName).toBe('Frame-testlattice')
          done()
        } catch (e) {
          done(e)
        }
      })

      signerObserver.fire()
    })

    it('does not create a new signer from one that is already known', () => {
      adapter.knownSigners['NBaJ8e'] = { deviceName: 'existing-frame-lattice' }
      Lattice.mockImplementation(() => {
        throw new Error('attempted to create duplicate signer!')
      })

      signerObserver.fire()

      expect(Object.keys(adapter.knownSigners)).toHaveLength(1)
    })

    it('connects to a paired signer', () => {
      store.set('main.lattice', 'NBaJ8e', 'paired', true)

      latticeSigner.connect.mockImplementation((baseUrl, privKey) => {
        expect(baseUrl).toBe('https://signing.gridpl.us')
        expect(privKey).toBe('supersecretkey')
        return Promise.resolve()
      })

      signerObserver.fire()

      expect(adapter.knownSigners['NBaJ8e']).toBeTruthy()
    })

    it('does not attempt to connect to an unpaired signer', () => {
      store.set('main.lattice', 'NBaJ8e', 'paired', false)

      latticeSigner.connect.mockImplementation(() => {
        throw new Error('should not attempt to connect!')
      })

      signerObserver.fire()

      expect(adapter.knownSigners['NBaJ8e']).toBeTruthy()
    })

    it('sets the device to unpaired if connecting fails', (done) => {
      latticeSigner.connect.mockImplementation(() => Promise.reject())

      store.updateLattice = (deviceId, { paired }) => {
        try {
          expect(deviceId).toBe('NBaJ8e')
          expect(paired).toBe(false)
          done()
        } catch (e) {
          done(e)
        }
      }

      signerObserver.fire()
    })
  })

  describe('signer events', () => {
    beforeEach(() => {
      // creates a new Lattice signer
      signerObserver.fire()
    })

    it('handles update events', () => {
      const updateHandler = jest.fn()
      adapter.once('update', updateHandler)

      latticeSigner.emit('update')

      expect(updateHandler).toHaveBeenCalledWith(
        expect.objectContaining({ deviceId: 'NBaJ8e', deviceName: 'Frame-testlattice' })
      )
    })

    it('derives addresses if the signer is paired', () => {
      latticeSigner.emit('connect', true)

      expect(latticeSigner.deriveAddresses).toHaveBeenCalled()
    })

    it('updates the Lattice to paired if signer is paired after connecting', () => {
      latticeSigner.emit('connect', true)

      expect(store.updateLattice).toHaveBeenCalledWith('NBaJ8e', expect.objectContaining({ paired: true }))
    })

    it('updates the Lattice to unpaired if signer is not paired after connecting', () => {
      latticeSigner.deriveAddresses.mockImplementation(() => {
        throw new Error('tried to derive addresses for un-paired Lattice!')
      })

      latticeSigner.emit('connect', false)

      expect(store.updateLattice).toHaveBeenCalledWith('NBaJ8e', expect.objectContaining({ paired: false }))
    })

    it('derives addresses if the signer has an active wallet after pairing', () => {
      latticeSigner.emit('paired', true)

      expect(latticeSigner.deriveAddresses).toHaveBeenCalled()
    })

    it('updates the paired state of the Lattice after pairing', () => {
      latticeSigner.emit('paired', false)

      // paired is always true even if there is no active wallet
      expect(store.updateLattice).toHaveBeenCalledWith('NBaJ8e', expect.objectContaining({ paired: true }))
    })

    it('updates the Lattice to unpaired after an error connecting', () => {
      latticeSigner.connection = { isPaired: false }

      latticeSigner.emit('error')

      expect(store.updateLattice).toHaveBeenCalledWith('NBaJ8e', expect.objectContaining({ paired: false }))
    })

    it('disconnects after an error', () => {
      latticeSigner.emit('error')

      expect(latticeSigner.disconnect).toHaveBeenCalled()
    })

    it('emits an update after an error', () => {
      const updateHandler = jest.fn()
      adapter.once('update', updateHandler)

      latticeSigner.emit('error')

      expect(updateHandler).toHaveBeenCalledWith(
        expect.objectContaining({ deviceId: 'NBaJ8e', deviceName: 'Frame-testlattice' })
      )
    })

    it('removes a known signer on close', () => {
      latticeSigner.emit('close')

      expect(adapter.knownSigners).toEqual({})
    })

    it('emits a remove event on close', () => {
      const updateHandler = jest.fn()
      adapter.once('remove', updateHandler)

      latticeSigner.emit('close')

      expect(updateHandler).toHaveBeenCalledWith('lattice-NBaJ8e')
    })
  })
})
