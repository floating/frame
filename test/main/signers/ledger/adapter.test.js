import HID from 'node-hid'
import LedgerSignerAdapter from '../../../../main/signers/ledger/adapter'
import { Status } from '../../../../main/signers/ledger/Ledger'

jest.mock('node-hid')

jest.mock('usb', () => {
  return {
    attachedDevices: () => [],
    getDeviceList: () => [],
    on: jest.fn(),
    removeListener: jest.fn()
  }
})

jest.mock('../../../../main/store/persist', () => ({
  get: jest.fn(),
  set: jest.fn(),
  queue: jest.fn()
}))

jest.mock('../../../../main/signers/ledger/Ledger', () => {
  const L = jest.requireActual('../../../../main/signers/ledger/Ledger')

  const constructor = function (devicePath) {
    const ledger = new L.default(devicePath)
    ledger.open = async function () { }

    ledger.connect = async function () {
      this.status = L.Status.OK
      ledger.emit('update')
    }

    ledger.close = async function () { ledger.emit('close') }

    return ledger
  }

  return { __esModule: true, default: constructor, Status: L.Status }
})

const ledgerUsbDevice = {
  deviceDescriptor: {
    idVendor: 11415,
    idProduct: 4117
  }
}

async function simulateLedgerConnection (path, deviceAddress = 1) {
  connectedHids.push({ interface: 0, usagePage: 0xffa0, path })
  return adapter.handleAttachedDevice({ ...ledgerUsbDevice, deviceAddress })
}

async function simulateLedgerDisconnection (path, deviceAddress = 1) {
  const hidIndex = connectedHids.findIndex(hid => hid.path === path)
  connectedHids.splice(hidIndex, 1)

  return adapter.handleDetachedDevice({ ...ledgerUsbDevice, deviceAddress })
}

let adapter, connectedHids

beforeEach(() => {
  jest.useFakeTimers()

  HID.devices.mockImplementation(() => connectedHids)
  connectedHids = []

  adapter = new LedgerSignerAdapter()
  adapter.open()
})

afterEach(() => {
  adapter.close()
})

afterAll(() => {
  jest.useRealTimers()
})

it('recognizes a Ledger Nano S', done => {
  adapter.once('add', ledger => {
    try {
      expect(ledger.devicePath).toBe('nano-s-path')
      done()
    } catch (e) { done(e) }
  })

  simulateLedgerConnection('nano-s-path')
})

it('creates a new Ledger when one is already attached', done => {
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

  simulateLedgerConnection('connected-nano-s-path', 1)
  simulateLedgerConnection('new-nano-s-path', 2)
})

it('handles a disconnected Ledger', done => {
  simulateLedgerConnection('nano-x-discon-path').then(() => {
    // ensure no Ledgers are added
    adapter.once('add', () => done('new Ledger should not be added!'))

    adapter.once('remove', id => {
      try {
        expect(id).toBe('88da20f4-2d91-5a86-b7ec-c86603d02ad8')
        expect(adapter.disconnections).toHaveLength(0)
        expect(Object.keys(adapter.knownSigners)).toHaveLength(0)
        done()
      } catch (e) { done(e) }
    })

    adapter.on('update', ledger => {
      try {
        expect(ledger.status).toBe(Status.DISCONNECTED)
      } catch (e) { done(e) }
    })

    simulateLedgerDisconnection('nano-x-discon-path')

    jest.advanceTimersByTime(5000)
  })
}, 200)

it('updates an existing Ledger when the eth app is exited', done => {
  let receivedDisconnect = false

  simulateLedgerConnection('nano-x-eth-app-path').then(() => {
    // ensure no Ledgers are added or removed
    adapter.once('add', () => done('new Ledger should not be added!'))
    adapter.once('remove', () => done('new Ledger should not be removed!'))
    adapter.on('update', ledger => {
      if (!receivedDisconnect && ledger.status === Status.DISCONNECTED) {
        return receivedDisconnect = true
      }

      try {
        expect(receivedDisconnect).toBe(true)
        expect(ledger.status).toBe(Status.OK)
        expect(ledger.devicePath).toBe('nano-x-eth-app-path')
        expect(adapter.disconnections).toHaveLength(0)
        expect(Object.keys(adapter.knownSigners)).toHaveLength(1)
        done()
      } catch (e) { done(e) }
    })

    simulateLedgerDisconnection('nano-x-eth-app-path', 1)
    simulateLedgerConnection('nano-x-eth-app-path', 2)
  })
}, 200)
