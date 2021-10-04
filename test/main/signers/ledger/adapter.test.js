import HID from 'node-hid'
import LedgerSignerAdapter from '../../../../main/signers/ledger/adapter'

jest.mock('usb', () => {
  return {
    attachedDevices: () => [],
    getDeviceList: () => [],
    on: jest.fn(),
    removeListener: jest.fn()
  }
})
jest.mock('node-hid')
jest.mock('../../../../main/store/persist', () => ({
  get: jest.fn(),
  set: jest.fn(),
  queue: jest.fn()
}))

jest.mock('../../../../main/signers/ledger/Ledger', () => {
  const L = jest.requireActual('../../../../main/signers/ledger/Ledger').default

  return function (devicePath) {
    const ledger = new L(devicePath)
    ledger.open = async function () { }
    ledger.connect = async function () { }

    return ledger
  }
})

let adapter

beforeEach(() => {
  HID.devices = jest.fn()

  adapter = new LedgerSignerAdapter()
  adapter.open()
})

afterEach(() => {
  adapter.close()
})


it('recognizes a Ledger Nano S', done => {
  HID.devices.mockImplementation(() => [{ interface: 0, usagePage: 0xffa0, path: 'nano-s-path' }])

  const device = {
    deviceDescriptor: {
      idVendor: 11415,
      idProduct: 4113
    }
  }

  adapter.on('add', ledger => {
    try {
      expect(ledger.devicePath).toBe('nano-s-path')
      done()
    } catch (e) { done(e) }
  })

  adapter.handleAttachedDevice(device)
})

it('creates a new Ledger when one is already attached', done => {
  HID.devices.mockImplementation(() => [
    { interface: 0, usagePage: 0xffa0, path: 'connected-nano-s-path', productId: 4113 },
    { interface: 0, usagePage: 0xffa0, path: 'new-nano-s-path', productId: 4113 },
  ])

  const deviceDescriptor = {
    idVendor: 11415,
    idProduct: 4113
  }

  const addedLedgers = []
  
  adapter.on('add', ledger => {
    addedLedgers.push(ledger)

    if (addedLedgers.length === 2) {
      try {
        expect(addedLedgers[0].devicePath).toBe('connected-nano-s-path')
        expect(addedLedgers[1].devicePath).toBe('new-nano-s-path')
        done()
      } catch (e) { done(e) }
    }
  })

  adapter.handleAttachedDevice({ deviceAddress: 1, deviceDescriptor })
  adapter.handleAttachedDevice({ deviceAddress: 2, deviceDescriptor })
})
