// @ts-nocheck

import usb from 'usb'
import log from 'electron-log'
import { getDevices as getLedgerDevices } from '@ledgerhq/hw-transport-node-hid-noevents'

import { UsbSignerAdapter } from '../adapters'
import Ledger from './Ledger'
import store from '../../store'
import { Derivation } from '../Signer/derive'

function updateDerivation (ledger: Ledger, derivation = store('main.ledger.derivation'), accountLimit) {
  const liveAccountLimit = accountLimit || (derivation === Derivation.live ? store('main.ledger.liveAccountLimit') : 0)

  ledger.derivation = derivation
  ledger.accountLimit = liveAccountLimit
}

export default class LedgerSignerAdapter extends UsbSignerAdapter {
  private knownSigners: { [key: string]: Ledger };
  private disconnections: { devicePath: string, timeout: NodeJS.Timeout }[]
  private observer: any;

  constructor () {
    super('ledger')

    this.knownSigners = {}
    this.disconnections = []
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
    log.debug(`detected Ledger device attached`, usbDevice)

    const knownPaths = Object.values(this.knownSigners).map(d => d.devicePath)
    const deviceId = this.deviceId(usbDevice)

    let devicePath = this.getAttachedDevicePath(knownPaths)

    if (!devicePath) {
      // if this isn't a new device, check if there is a pending disconnection
      const pendingDisconnection = this.disconnections.pop()

      if (!pendingDisconnection) {
        log.error(`could not determine path for attached Ledger device`, usbDevice)
        return
      }

      clearTimeout(pendingDisconnection.timeout)
      devicePath = pendingDisconnection.devicePath
    }

    let [existingDeviceId, ledger] = Object.entries(this.knownSigners)
      .find(([deviceId, ledger]) => ledger.devicePath === devicePath) || []

    if (ledger) {
      delete this.knownSigners[existingDeviceId]
    } else {
      ledger = new Ledger(devicePath)

      const emitUpdate = () => this.emit('update', ledger)

      ledger.on('update', emitUpdate)
      ledger.on('error', emitUpdate)
      ledger.on('lock', emitUpdate)

      ledger.on('close', () => {
        this.emit('remove', ledger.id)
      })

      ledger.on('unlock', () => {
        ledger.connect()
      })

      this.emit('add', ledger)
    }

    this.knownSigners[deviceId] = ledger

    updateDerivation(ledger)

    await ledger.open()
    await ledger.connect()
  }

  handleDetachedDevice (usbDevice: usb.Device) {
    log.debug(`detected Ledger device detached`, usbDevice)

    const deviceId = this.deviceId(usbDevice)

    if (deviceId in this.knownSigners) {
      const ledger = this.knownSigners[deviceId]

      ledger.disconnect()

      // when a user exits the eth app, it takes a few seconds for the
      // main ledger to reconnect via USB, so attempt to wait for this event
      // instead of immediately removing the signer
      this.disconnections.push({
        devicePath: ledger.devicePath,
        timeout: setTimeout(() => {
          const index = this.disconnections.findIndex(d => d.devicePath === ledger.devicePath)
          this.disconnections.splice(index, 1)

          delete this.knownSigners[deviceId]

          ledger.close()
        }, 5000)
      })
    }
  }

  private getAttachedDevicePath (knownDevicePaths: string[]) {
    // check all Ledger devices and return the device that isn't yet known
    const hid = getLedgerDevices().find(d => !knownDevicePaths.includes(d.path))

    return hid?.path || ''
  }

  supportsDevice (usbDevice: usb.Device) {
    return usbDevice.deviceDescriptor.idVendor === 0x2c97
  }
}
