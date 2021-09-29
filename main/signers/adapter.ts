import { EventEmitter } from 'stream'

import log from 'electron-log'
import usb from 'usb'
import HID from 'node-hid'

import Ledger from './ledger/Ledger'
import store from '../store'

export class SignerAdapter extends EventEmitter {
  name: string;

  constructor (name: string) {
    super() 

    this.name = name
  }
}

function findHid (usbDevice: usb.Device) {
  return HID
    .devices(usbDevice.deviceDescriptor.idVendor, usbDevice.deviceDescriptor.idProduct)
    .find(device => device.interface === 0) || { path: '' }
}

export class UsbSignerAdapter extends SignerAdapter {
  private attachListener: (device: usb.Device) => void;
  private detachListener: (device: usb.Device) => void;

  private knownSigners: { [key: number]: Ledger };

  constructor (name: string) {
    super(name)

    this.knownSigners = {}

    this.attachListener = usbDevice => {
      if (this.supportsDevice(usbDevice)) {
        log.debug(`detected Ledger device attached`)

        const hid = findHid(usbDevice)

        if (!hid.path) {
          log.error(`could not determine path for attached Ledger device`, usbDevice)
          return
        }

        if (!(usbDevice.deviceAddress in this.knownSigners)) {
          this.knownSigners[usbDevice.deviceAddress] = new Ledger(hid.path)
          this.emit('add', this.knownSigners[usbDevice.deviceAddress])
        }

        const ledger = this.knownSigners[usbDevice.deviceAddress]

        ledger.connect().then(() => {
          const derivation = store('main.ledger.derivation')
          const accountLimit = derivation === 'live' ? store('main.ledger.liveAccountLimit') : 0

          ledger.derivation = derivation

          const emitter = () => this.emit('update', ledger)

          ledger.on('addresses', emitter)
          ledger.on('status', emitter)

          ledger.deriveAddresses(accountLimit)
            .then(() => {
              ledger.status = 'ok'
              this.emit('update', ledger)
            })
        })
      }
    }

    this.detachListener = usbDevice => {
      if (this.supportsDevice(usbDevice)) {
        log.debug(`detected Ledger device detached`)

        const hid = findHid(usbDevice)
        const devicePath = hid.path || ''

        if (usbDevice.deviceAddress in this.knownSigners) {
          const ledger = this.knownSigners[usbDevice.deviceAddress]

          this.emit('remove', ledger.id)
          delete this.knownSigners[usbDevice.deviceAddress]
        }
      }
    }

    usb.on('attach', this.attachListener)
    usb.on('detach', this.detachListener)
  }

  close () {
    usb.removeListener('attach', this.attachListener)
    usb.removeListener('detach', this.detachListener)
  }

  deviceId (device: usb.Device) {
    return [
      device.busNumber,
      device.deviceAddress,
      device.deviceDescriptor.idProduct,
      device.deviceDescriptor.idVendor
    ].join(':')
  }

  supportsDevice (device: usb.Device) {
    return false
  }
}