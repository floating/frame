const TrezorConnect = require('trezor-connect').default
const EventEmitter = require('events')
const events = new EventEmitter()
let ready = false

class Device {
  constructor (device, emit) {
    this.device = device
    this.id = device.path
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
  needPin () {
    this.emit('trezor:needPin', this.device)
  }
  needPhrase () {
    this.emit('trezor:needPhrase', this.device)
  }
  inputPin (pin, cb) {
    TrezorConnect.uiResponse({ device: this.device, type: 'ui-receive_pin', payload: pin })
    cb()
  }
  inputPhrase (phrase, cb) {
    TrezorConnect.uiResponse({ device: this.device, type: 'ui-receive_passphrase', payload: { value: phrase } })
    cb()
  }
  getPublicKey (path, cb) {
    TrezorConnect.getPublicKey({ device: this.device, path }).then(res => {
      if (!res.success) return cb(new Error(res.payload.error))
      cb(null, res.payload)
    }).catch(err => cb(err))
  }
  ethereumGetAddress (path, showOnTrezor, cb) {
    TrezorConnect.ethereumGetAddress({ device: this.device, path, showOnTrezor }).then(res => {
      if (!res.success) return cb(new Error(res.payload.error))
      cb(null, res.payload)
    }).catch(err => cb(err))
  }
  ethereumSignTransaction (path, transaction, cb) {
    TrezorConnect.ethereumSignTransaction({ device: this.device, path, transaction }).then(res => {
      if (!res.success) return cb(new Error(res.payload.error))
      cb(null, res.payload)
    }).catch(err => cb(err))
  }
  ethereumSignMessage (path, message, cb) {
    TrezorConnect.ethereumSignMessage({ device: this.device, path, message, hex: true }).then(res => {
      if (!res.success) return cb(new Error(res.payload.error))
      cb(null, res.payload)
    }).catch(err => cb(err))
  }
  ethereumVerifyMessage (path, address, message, signature, cb) {
    TrezorConnect.ethereumVerifyMessage({ device: this.device, path, address, message, signature }).then(res => {
      if (!res.success) return cb(new Error(res.payload.error))
      cb(null, res.payload)
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
        if (this.devices[e.payload.path]) this.devices[e.payload.path].disconnect()
        delete this.devices[e.payload.path]
      }
    })
    TrezorConnect.on('UI_EVENT', e => {
      if (e.type === 'ui-request_pin') {
        const device = this.devices[e.payload.device.path]
        if (device) device.needPin()
      } else if (e.type === 'ui-request_passphrase') {
        console.log('Device needs passphrase')
      }
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
  deviceNotFound (id, cb) {
    cb(new Error(`Device with id: ${id} not found`))
  }
  inputPin (id, pin, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].inputPin(pin, cb)
  }
  inputPhrase (id, phrase, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].inputPin(phrase, cb)
  }
  getPublicKey (id, path, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].getPublicKey(path, cb)
  }
  ethereumGetAddress (id, path, display, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].ethereumGetAddress(path, display, cb)
  }
  ethereumSignTransaction (id, path, tx, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].ethereumSignTransaction(path, tx, cb)
  }
  ethereumSignMessage (id, path, message, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].ethereumSignMessage(path, message, cb)
  }
  ethereumVerifyMessage (id, path, message, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].ethereumVerifyMessage(path, message, cb)
  }
}

module.exports = Trezor
