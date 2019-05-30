const TrezorConnect = require('trezor-connect').default
const EventEmitter = require('events')
const events = new EventEmitter()
let ready = false

class Device {
  constructor (device, emit) {
    this.device = device
    this.id = device.path
    this.label = device.label
    this.emit = emit
    if (ready) return this.setup()
    events.once('ready', () => this.setup())
  }
  setup () {
    this.connect()
  }
  connect () {
    this.emit('trezor:connect', this.device)
  }
  disconnect () {
    this.emit('trezor:disconnect', this.device)
  }
  update (device = this.device) {
    this.device = device
    this.emit('trezor:update', this.device)
  }
  getPublicKey (path, cb) {
    TrezorConnect.getPublicKey({ device: this.device, path }).then(response => {
      if (!response.success) return cb(response.payload)
      cb(null, response.payload)
    }).catch(err => cb(err))
  }
  ethereumGetAddress (path, showOnTrezor, cb) {
    TrezorConnect.ethereumGetAddress({ device: this.device, path, showOnTrezor }).then(response => {
      if (!response.success) return cb(response.payload)
      cb(null, response.payload)
    }).catch(err => cb(err))
  }
}

class Trezor {
  constructor (emit) {
    this.emit = emit
    this.devices = {}
    TrezorConnect.on('DEVICE_EVENT', e => {
      if (e.type === 'device-connect' || e.type === 'device-changed') {
        if (!this.devices[e.payload.path]) {
          this.devices[e.payload.path] = new Device(e.payload, this.emit)
        } else {
          this.devices[e.payload.path].update(e.payload)
        }
      } else if (e.type === 'device-disconnect') {
        this.devices[e.payload.path].disconnect()
        delete this.devices[e.payload.path]
      }
    })
    TrezorConnect.on('UI_EVENT', e => {
      console.log('UI_EVENT', e.type)
      // if (e.type === UI.REQUEST_PIN) TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: '1234' })
      // if (e.type === UI.REQUEST_PASSPHRASE) TrezorConnect.uiResponse({ type: UI.RECEIVE_PASSPHRASE, payload: { value: 'type your passphrase here' }})
    })

    const manifest = { email: 'j@j.com', appUrl: 'electron-app-boilerplate' }
    const connectSrc = 'https://sisyfos.trezor.io/connect-electron/'
    const config = { connectSrc, manifest, popup: false, webusb: false, debug: false, lazyLoad: false }
    try {
      TrezorConnect.init(config).then(() => {
        ready = true
        events.emit('ready')
      }).catch(err => console.warn('TrezorConnect Init Error', err))
    } catch (e) { console.warn(e) }
  }
  scan (cb) {
    Object.keys(this.devices).forEach(id => this.devices[id].update())
  }
  getPublicKey (deviceId, path, cb) {
    this.devices[deviceId].getPublicKey(path, cb)
  }
  ethereumGetAddress (deviceId, path, display, cb) {
    this.devices[deviceId].ethereumGetAddress(path, display, cb)
  }
  signEthMessage (deviceId, path, message, cb) {
    this.devices[deviceId].signEthMessage(path, message, cb)
  }
}

module.exports = Trezor
