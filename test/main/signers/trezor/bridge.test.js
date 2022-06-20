import Connect from '../../../../main/signers/trezor/bridge'
import TrezorConnect, { DEVICE_EVENT, DEVICE, UI_EVENT, UI } from 'trezor-connect'
import { EventEmitter } from 'stream'
import log from 'electron-log'


jest.mock('trezor-connect')

const events = new EventEmitter()
const trezorConnect = new Connect()

beforeAll(() => {
  log.transports.console.level = false

  TrezorConnect.on = events.on.bind(events)
  TrezorConnect.once = events.once.bind(events)
  TrezorConnect.emit = events.emit.bind(events)
  TrezorConnect.removeAllListeners = events.removeAllListeners.bind(events)
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

beforeEach(done => {
  trezorConnect.once('connect', done)
  trezorConnect.open()
})

afterEach(async () => trezorConnect.close())

describe('connect events', () => {
  it('emits a detected event on device changed event with type unacquired', done => {
    trezorConnect.once('trezor:detected', path => {
      try {
        expect(path).toBe('27')
        done()
      } catch (e) { done(e) }
    })

    TrezorConnect.emit(DEVICE_EVENT, { type: DEVICE.CHANGED, payload: { type: 'unacquired', path: '27', features: {} } })
  })

  it('emits a detected event on device unacquired event', done => {
    trezorConnect.once('trezor:detected', path => {
      try {
        expect(path).toBe('27')
        done()
      } catch (e) { done(e) }
    })

    TrezorConnect.emit(DEVICE_EVENT, { type: DEVICE.CONNECT_UNACQUIRED, payload: { type: 'unacquired', path: '27', features: {} } })
  })

  it('emits a connected event on device connected event with type acquired', done => {
    const payload = { type: 'acquired', path: '27', features: { firmwareVersion: '2.1.4' } }

    trezorConnect.once('trezor:connect', device => {
      try {
        expect(device).toEqual(payload)
        done()
      } catch (e) { done(e) }
    })

    TrezorConnect.emit(DEVICE_EVENT, { type: DEVICE.CONNECT, payload })
  })

  it('emits a disconnected event on device disconnected event', done => {
    const payload = { type: 'acquired', path: '27', features: { firmwareVersion: '2.1.4' } }

    trezorConnect.once('trezor:disconnect', device => {
      try {
        expect(device).toEqual(payload)
        done()
      } catch (e) { done(e) }
    })

    TrezorConnect.emit(DEVICE_EVENT, { type: DEVICE.DISCONNECT, payload })
  })
})

describe('ui events', () => {
  it('emits a needPin event when a pin is requested', done => {
    const device = { type: 'acquired', id: 'someid1234' }

    trezorConnect.once('trezor:needPin', device => {
      try {
        expect(device).toEqual(device)
        done()
      } catch (e) { done(e) }
    })

    TrezorConnect.emit(UI_EVENT, { type: UI.REQUEST_PIN, payload: { device } })
  })

  it('emits a needPhrase event when a passphrase is requested and entry on the device is not supported', done => {
    const device = { type: 'acquired', id: 'someid1234' }
    const payload = { device, features: { capabilities: [] }}

    trezorConnect.once('trezor:needPhrase', device => {
      try {
        expect(device).toEqual(device)
        done()
      } catch (e) { done(e) }
    })

    TrezorConnect.emit(UI_EVENT, { type: UI.REQUEST_PASSPHRASE, payload })
  })

  it('emits an enteringPhrase event when a passphrase is requested and will be entered on the device', done => {
    const device = {
      type: 'acquired',
      id: 'someid1234',
      features: { capabilities: ['Capability_PassphraseEntry'] }
    }

    trezorConnect.once('trezor:enteringPhrase', device => {
      try {
        expect(device).toEqual(device)
        done()
      } catch (e) { done(e) }
    })

    TrezorConnect.emit(UI_EVENT, { type: UI.REQUEST_PASSPHRASE, payload: { device } })
  })
})
