import os from 'os'
import usb from 'usb'
import log from 'electron-log'

import { DeviceModel } from '@ledgerhq/devices'
import { getDevices as getLedgerDevices } from '@ledgerhq/hw-transport-node-hid-noevents'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-singleton'
import { Subscription } from '@ledgerhq/hw-transport'

import { SignerAdapter } from '../adapters'
import Ledger from './Ledger'
import store from '../../store'
import { Derivation } from '../Signer/derive'

const IS_WINDOWS = os.type().toLowerCase().includes('windows')

function updateDerivation (ledger: Ledger, derivation = store('main.ledger.derivation'), accountLimit = 0) {
  const liveAccountLimit = accountLimit || (derivation === Derivation.live ? store('main.ledger.liveAccountLimit') : 0)

  ledger.derivation = derivation
  ledger.accountLimit = liveAccountLimit
}

export default class LedgerSignerAdapter extends SignerAdapter {
  private knownSigners: Ledger[];
  private disconnections: { devicePath: string, timeout: NodeJS.Timeout }[]

  private observer: any;
  private usbListener: Subscription | undefined;

  constructor () {
    super('ledger')

    this.knownSigners = []
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

    this.usbListener = TransportNodeHid.listen({
      next: evt => {
        if (!evt.deviceModel) {
          log.warn('received USB event with no Ledger device model', evt)
          return
        }

        if (evt.type === 'add') {
          return this.handleAttachedDevice(evt.deviceModel)
        }

        if (evt.type === 'remove') {
          return this.handleDetachedDevice(evt.deviceModel)
        }
      },
      complete: () => {
        log.debug('received USB complete event')
      },
      error: err => {
        log.error('USB error', err)
      }
    })

    super.open()
  }

  close () {
    this.observer.remove()

    if (this.usbListener) {
      this.usbListener.unsubscribe()
    }

    super.close()
  }

  reload (signer: Ledger) {
    const ledger = this.knownSigners.find(s => s.devicePath === signer.devicePath)

    if (ledger) {
      ledger.disconnect()
        .then(() => ledger.open())
        .then(() => ledger.connect())
    }
  }

  async handleAttachedDevice (usbDevice: DeviceModel) {
    log.debug(`detected Ledger device attached`, usbDevice)

    let ledger: Ledger
    let devicePath = this.getAttachedDevicePath()

    console.log({ devicePath })

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

    let existingDeviceIndex = this.getSignersForModel(usbDevice)
      .findIndex(ledger => ledger.devicePath === devicePath)

    if (existingDeviceIndex >= 0) {
      console.log('EXISTING LEDGER')
      ledger = this.knownSigners[existingDeviceIndex]
    } else {
      console.log('NEW LEDGER')
      ledger = new Ledger(devicePath, usbDevice.id)

      const emitUpdate = () => this.emit('update', ledger)

      ledger.on('update', emitUpdate)
      ledger.on('error', emitUpdate)
      ledger.on('lock', emitUpdate)

      ledger.on('close', () => {
        this.emit('remove', ledger?.id)
      })

      ledger.on('unlock', () => {
        ledger?.connect()
      })

      this.emit('add', ledger)

      this.knownSigners.push(ledger)
    }

    updateDerivation(ledger)

    await ledger.open()
    await ledger.connect()
  }

  handleDetachedDevice (usbDevice: DeviceModel) {
    log.debug(`detected Ledger device detached`, usbDevice)

    const ledger = this.getDetachedSigner(usbDevice)

    console.log({ ledger })

    if (ledger) {
      ledger.disconnect()

      const close = () => {
        this.knownSigners.splice(this.knownSigners.indexOf(ledger), 1)

        ledger.close()
      }

      if (IS_WINDOWS) {
        // on Windows, the device reconnects with a completely different mount point
        // path, thus we can't reliably check if the one that reconnects is the one that
        // was disconnected, so just close immediately
        close()
      } else {
        // on all other platforms when a user exits the eth app, it takes a few seconds for the
        // main ledger to reconnect via USB and it does so with the same path
        // as the one that was disconnected, so attempt to wait for this event
        // instead of immediately removing the signer
        this.disconnections.push({
          devicePath: ledger.devicePath,
          timeout: setTimeout(() => {
            const index = this.disconnections.findIndex(d => d.devicePath === ledger.devicePath)
            this.disconnections.splice(index, 1)

            close()
          }, 5000)
        })
      }
    }
  }

  private getAttachedDevicePath () {
    // check all Ledger devices and return the device that isn't yet known
    const knownDevicePaths = this.knownSigners.map(d => d.devicePath)
    const hid = getLedgerDevices().find(d => !knownDevicePaths.includes(d.path || ''))

    return hid?.path || ''
  }

  private getDetachedSigner (usbDevice: DeviceModel) {
    // check all Ledger devices and return the device that is missing from the known devices
    const attachedDevices = getLedgerDevices()

    return this.getSignersForModel(usbDevice).find(signer =>
      !attachedDevices.some(device => device.path === signer.devicePath)
    )
  }

  private getSignersForModel (usbDevice: DeviceModel) {
    return this.knownSigners.filter(signer => signer.model === usbDevice.id)
  }
}
