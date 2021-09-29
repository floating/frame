// @ts-nocheck

import usb from 'usb'
import log from 'electron-log'

import { UsbSignerAdapter } from '../adapters'
import Ledger from './Ledger'
import store from '../../store'

const supportedPlatforms = ['win32', 'darwin']

const supportedModels = [
  function isNanoX (device: usb.Device) {
    return (
      device.deviceDescriptor.idVendor === 0x2581 &&
      device.deviceDescriptor.idProduct === 0x3b7c
    )
  },
  function isNanoS (device: usb.Device) {
    return (
      device.deviceDescriptor.idVendor === 0x2c97 &&
      device.deviceDescriptor.idProduct === 0x1015
    )
  }
]

export default class LedgerSignerAdapter extends UsbSignerAdapter {
  private knownSigners: { [key: string]: Ledger };

  constructor () {
    super('Ledger')

    this.knownSigners = {}
  }

  handleAttachedDevice (usbDevice: usb.Device) {
    log.debug(`detected Ledger device attached`)

    const deviceId = this.deviceId(usbDevice)
    const devicePath = this.getDevicePath(usbDevice)

    if (!devicePath) {
      log.error(`could not determine path for attached Ledger device`, usbDevice)
      return
    }

    if (!(deviceId in this.knownSigners)) {
      this.knownSigners[deviceId] = new Ledger(devicePath)
      this.emit('add', this.knownSigners[deviceId])
    }

    const ledger = this.knownSigners[deviceId]

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

  handleDetachedDevice (usbDevice: usb.Device) {
    log.debug(`detected Ledger device detached`)

    const deviceId = this.deviceId(usbDevice)

    if (deviceId in this.knownSigners) {
      const ledger = this.knownSigners[deviceId]

      this.emit('remove', ledger.id)
      delete this.knownSigners[deviceId]
    }
  }

  getDevicePath (usbDevice: usb.Device) {
    const devices = this.findHid(usbDevice)
    const hid = devices.find(device => device.interface === 0)

    return hid?.path || ''
  }

  supportsDevice (usbDevice: usb.Device) {
    return supportedModels.some(checkSupport => checkSupport(usbDevice))
  }
}
