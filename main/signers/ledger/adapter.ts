// @ts-nocheck

import usb from 'usb'
import log from 'electron-log'

import { UsbSignerAdapter } from '../adapters'
import Ledger from './Ledger'
import store from '../../store'
import { Derivation } from './Ledger/eth'

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
      device.deviceDescriptor.idVendor === 0x2c97
    )
  }
]

function updateDerivation (ledger: Ledger, derivation = store('main.ledger.derivation'), accountLimit) {
  const liveAccountLimit = accountLimit || (derivation === Derivation.live ? store('main.ledger.liveAccountLimit') : 0)

  ledger.derivation = derivation
  ledger.accountLimit = liveAccountLimit
}

export default class LedgerSignerAdapter extends UsbSignerAdapter {
  private knownSigners: { [key: string]: Ledger };
  private disconnections: { [key: string]: NodeJS.Timeout }
  private observer: any;

  constructor () {
    super('Ledger')

    this.knownSigners = {}
    this.disconnections = {}
  }

  open () {
    this.observer = store.observer(() => {
      const ledgerDerivation = store('main.ledger.derivation')
      const liveAccountLimit = store('main.ledger.liveAccountLimit')

      Object.values(this.knownSigners).forEach(ledger => {
        if (
          ledger.derivation !== ledgerDerivation || 
          (ledger.derivation === 'live' && ledger.accountLimit !== liveAccountLimit)
        ) {
          updateDerivation(ledger, ledgerDerivation, liveAccountLimit)
          ledger.deriveAddresses()
        }
      })
    })

    super.open()
  }

  close () {
    this.observer.remove()

    super.close()
  }

  async handleAttachedDevice (usbDevice: usb.Device) {
    log.debug(`detected Ledger device attached`)

    const deviceId = this.deviceId(usbDevice)
    const devicePath = this.getDevicePath(usbDevice)

    if (!devicePath) {
      log.error(`could not determine path for attached Ledger device`, usbDevice)
      return
    }

    const pendingDisconnection = this.disconnections[devicePath]

    if (pendingDisconnection) {
      clearTimeout(pendingDisconnection)
      delete this.disconnections[devicePath]
    }

    let [existingDeviceId, ledger] = Object.entries(this.knownSigners)
      .find(([deviceId, ledger]) => ledger.devicePath === devicePath) || []

    if (ledger) {
      delete this.knownSigners[existingDeviceId]
    } else {
      ledger = new Ledger(devicePath)
      this.emit('add', ledger)
    }

    this.knownSigners[deviceId] = ledger
    const emitUpdate = () => this.emit('update', ledger)

    ledger.on('update', emitUpdate)
    ledger.on('close', emitUpdate)
    ledger.on('error', emitUpdate)
    ledger.on('lock', emitUpdate)

    ledger.on('unlock', () => {
      ledger.connect()
    })

    updateDerivation(ledger)

    await ledger.open()
    await ledger.connect()
  }

  handleDetachedDevice (usbDevice: usb.Device) {
    log.debug(`detected Ledger device detached`)

    const deviceId = this.deviceId(usbDevice)

    if (deviceId in this.knownSigners) {
      const ledger = this.knownSigners[deviceId]

      ledger.close()

      // when a user exits the eth app, it takes a few seconds for the
      // main ledger to reconnect via USB, so wait for this instead of
      // immediately removing the signer
      this.disconnections[ledger.devicePath] = setTimeout(() => {
        this.emit('remove', ledger.id)
        delete this.knownSigners[deviceId]
      }, 5000)
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
