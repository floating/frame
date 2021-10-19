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
import { map } from '../../api/protectedMethods'
import { Device } from '@ledgerhq/hw-transport-web-ble/lib/types'

const IS_WINDOWS = os.type().toLowerCase().includes('windows')

function updateDerivation (ledger: Ledger, derivation = store('main.ledger.derivation'), accountLimit = 0) {
  const liveAccountLimit = accountLimit || (derivation === Derivation.live ? store('main.ledger.liveAccountLimit') : 0)

  ledger.derivation = derivation
  ledger.accountLimit = liveAccountLimit
}

interface Disconnection {
  device: Ledger,
  timeout: NodeJS.Timeout
}

export default class LedgerSignerAdapter extends SignerAdapter {
  private knownSigners: Ledger[];
  private disconnections: Disconnection[]

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
        log.debug(`received ${evt.type} USB event`)

        if (!evt.deviceModel) {
          log.warn('received USB event with no Ledger device model', evt)
          return
        }
        
        const { attachedDevices, reconnectedLedgers, detachedLedgers } = this.detectDeviceChanges()

        console.log({ attachedDevices, reconnectedLedgers, detachedLedgers })

        detachedLedgers.forEach(ledger => this.handleDisconnectedDevice(ledger))
        reconnectedLedgers.forEach(ledger => this.handleConnectedDevice(ledger))
        attachedDevices.forEach(device => this.handleAttachedDevice(device.path as string, device.product || ''))
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

  private async handleConnectedDevice (ledger: Ledger) {
    log.debug(`Ledger ${ledger.model} connected`, ledger.devicePath)

    this.knownSigners.push(ledger)

    updateDerivation(ledger)

    await ledger.open()
    await ledger.connect()
  }

  private async handleAttachedDevice (devicePath: string, deviceId: string) {
    log.debug(`Ledger ${deviceId} attached`, devicePath)


    // if (!devicePath) {
    //   // if this isn't a new device, check if there is a pending disconnection
    //   const pendingDisconnection = this.disconnections.pop()

    //   if (!pendingDisconnection) {
    //     log.error(`could not determine path for attached Ledger device`, usbDevice)
    //     return
    //   }

    //   clearTimeout(pendingDisconnection.timeout)
    //   devicePath = pendingDisconnection.devicePath
    // }

    const ledger = new Ledger(devicePath, deviceId)

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
    
    await this.handleConnectedDevice(ledger)
  }

  handleDisconnectedDevice (ledger: Ledger) {
    log.debug(`Ledger ${ledger.model} disconnected`, ledger.devicePath)

    // console.log('BEFORE', this.knownSigners.map(s => s.devicePath))

    this.knownSigners.splice(this.knownSigners.indexOf(ledger), 1)
    // console.log('AFTER', this.knownSigners.map(s => s.devicePath))

    ledger.disconnect()

    if (IS_WINDOWS) {
      // on Windows, the device reconnects with a completely different mount point
      // path, thus we can't reliably check if the one that reconnects is the one that
      // was disconnected, so just close immediately
      ledger.close()
    } else {
      // on all other platforms when a user exits the eth app, it takes a few seconds for the
      // main ledger to reconnect via USB and it does so with the same path
      // as the one that was disconnected, so attempt to wait for this event
      // instead of immediately removing the signer
      this.disconnections.push({
        device: ledger,
        timeout: setTimeout(() => {
          const index = this.disconnections.findIndex(d => d.device.devicePath === ledger.devicePath)
          this.disconnections.splice(index, 1)

          log.debug(`Ledger ${ledger.model} detached`, ledger.devicePath)

          ledger.close()
        }, 5000)
      })
    }
  }

  private detectDeviceChanges () {
    const reconnectedLedgers: Ledger[] = []
    const knownDevicePaths = this.knownSigners.map(d => d.devicePath)
    const ledgerDevices = getLedgerDevices().filter(device => !!device.path)

    const attachedDevices = ledgerDevices
      .filter(device => !knownDevicePaths.includes(device.path as string))

    const detachedLedgers = this.knownSigners.filter(signer => 
      !ledgerDevices.some(device => device.path === signer.devicePath)
    )

    // check if any disconnected devices have been reconnected using the same device path
    attachedDevices.forEach(device => {
      const devicePath = device.path as string
      const disconnectionIndex = this.disconnections.findIndex(d => d.device.devicePath === devicePath)

      if (disconnectionIndex > -1) {
        const disconnection = this.disconnections.splice(disconnectionIndex, 1)[0]
        
        clearTimeout(disconnection.timeout)
        reconnectedLedgers.push(disconnection.device)
        attachedDevices.splice(attachedDevices.findIndex(device => device.path === devicePath), 1)
      }
    })

    // if more devices have been added and we are still waiting on reconnections,
    // assume that these are the reconnection events, this happens on Windows because
    // the devices reconnect at a different device path from the one from which they were disconnected
    while (this.disconnections.length > 0 && attachedDevices.length > 0) {
      const disconnection = this.disconnections.pop() as Disconnection
      const attachedDevice = attachedDevices.pop() as Device

      clearTimeout(disconnection.timeout)

      const ledger = disconnection.device
      ledger.devicePath = attachedDevice.path

      reconnectedLedgers.push(ledger)
    }

    return { attachedDevices, reconnectedLedgers, detachedLedgers }
  }
}
