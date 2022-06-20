const EventEmitter = require('events')
// const {
//   default: TrezorConnect,
//   DEVICE_EVENT,
//   DEVICE,
//   UI_EVENT,
//   UI
// } = require('trezor-connect')

const events = new EventEmitter()
events.setMaxListeners(128)
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

  enteringPhrase () {
    this.emit('trezor:enteringPhrase', this.device)

    TrezorConnect.uiResponse({
      type: UI.RECEIVE_PASSPHRASE,
      payload: { value: '', passphraseOnDevice: true }
    })
  }

  inputPin (pin, cb) {
    TrezorConnect.uiResponse({ device: this.device, type: UI.RECEIVE_PIN, payload: pin })
    cb()
  }

  inputPhrase (phrase, cb) {
    TrezorConnect.uiResponse({ device: this.device, type: UI.RECEIVE_PASSPHRASE, payload: { value: phrase } })
    cb()
  }

  getPublicKey (path, cb) {
    TrezorConnect.getPublicKey({ device: this.device, path }).then(res => {
      if (!res.success) return cb(new Error(res.payload.error))
      cb(null, res.payload)
    }).catch(err => cb(err))
  }

  ethereumGetAddress (path, showOnTrezor = false, cb) {
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

  ethereumSignTypedData (path, data, cb) {
    TrezorConnect.ethereumSignTypedData({ device: this.device, path, data, metamask_v4_compat: true }).then(res => {
      if (!res.success) return cb(new Error(res.payload.error))
      cb(null, res.payload)
    }).catch(err => cb(err))
  }

  ethereumSignTypedHash (path, data, domainSeparatorHash, messageHash, cb) {
    TrezorConnect.ethereumSignTypedData({ device: this.device, path, data, domain_separator_hash: domainSeparatorHash, message_hash: messageHash, metamask_v4_compat: true }).then(res => {
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
    if (true) return
    this.emit = emit
    this.devices = {}

    TrezorConnect.on(DEVICE_EVENT, e => {
      if (e.type === DEVICE.CONNECT || e.type === DEVICE.CHANGED) {
        // when plugging in the Trezor, the first event can sometimes be "unacquired" which
        // does not have any information about the firmware, so ignore it and wait
        // for an "acquired" event
        if (e.payload.type === 'acquired') {
          if (!this.devices[e.payload.path]) {
            this.devices[e.payload.path] = new Device(e.payload, this.emit)
          } else {
            this.devices[e.payload.path].update(e.payload)
          }
        }
      } else if (e.type === 'device-disconnect') {
        if (this.devices[e.payload.path]) this.devices[e.payload.path].disconnect()
        delete this.devices[e.payload.path]
      }
    })

    TrezorConnect.on(UI_EVENT, e => {
      if (e.type === UI.REQUEST_PIN) {
        const device = this.devices[e.payload.device.path]
        if (device) device.needPin()
      } else if (e.type === UI.REQUEST_PASSPHRASE) {
        const device = this.devices[e.payload.device.path]

        if (device) {
          const capabilities = (device.device.features || {}).capabilities || []

          if (capabilities.includes('Capability_PassphraseEntry')) {
            device.enteringPhrase()
          } else {
            device.needPhrase()
          }
        }
      }
    })

    const manifest = { email: 'jordan@frame.sh', appUrl: 'https://frame.sh' }
    const config = { manifest, popup: false, webusb: false, debug: false, lazyLoad: false }

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
    this.devices[id].inputPhrase(phrase, cb)
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

  ethereumSignTypedData (id, path, message, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].ethereumSignTypedData(path, message, cb)
  }

  ethereumSignTypedHash (id, path, data, domainSeparatorHash, messageHash, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].ethereumSignTypedHash(path, data, domainSeparatorHash, messageHash, cb)
  }

  ethereumVerifyMessage (id, path, message, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].ethereumVerifyMessage(path, message, cb)
  }
}

module.exports = Trezor
