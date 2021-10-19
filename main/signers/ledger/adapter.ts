import log from 'electron-log'

import { getDevices as getLedgerDevices } from '@ledgerhq/hw-transport-node-hid-noevents'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-singleton'
import { Device } from '@ledgerhq/hw-transport-web-ble/lib/types'
import { Subscription } from '@ledgerhq/hw-transport'

import { Derivation } from '../Signer/derive'
import { SignerAdapter } from '../adapters'
import Ledger from './Ledger'
import store from '../../store'

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

        detachedLedgers.forEach(ledger => this.handleDisconnectedDevice(ledger))
        reconnectedLedgers.forEach(ledger => this.handleConnectedDevice(ledger))
        attachedDevices.forEach(device => this.handleAttachedDevice(device.path, device.product || 'Ledger'))
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
    if (this.observer) {
      this.observer.remove()
    }

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

  private async handleAttachedDevice (devicePath: string, model: string) {
    log.debug(`Ledger ${model} attached`, devicePath)

    const ledger = new Ledger(devicePath, model)

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
    
    await this.handleConnectedDevice(ledger)
  }

  private async handleConnectedDevice (ledger: Ledger) {
    log.debug(`Ledger ${ledger.model} connected`, ledger.devicePath)

    this.knownSigners.push(ledger)

    updateDerivation(ledger)

    await ledger.open()
    await ledger.connect()
  }

  handleDisconnectedDevice (ledger: Ledger) {
    log.debug(`Ledger ${ledger.model} disconnected`, ledger.devicePath)

    this.knownSigners.splice(this.knownSigners.indexOf(ledger), 1)

    ledger.disconnect()

    // when a user exits the eth app, it takes a few seconds for the
    // main ledger to reconnect via USB, so attempt to wait for this event
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

  private detectDeviceChanges () {
    const reconnectedLedgers: Ledger[] = []
    const knownDevicePaths = this.knownSigners.map(d => d.devicePath)
    const ledgerDevices = getLedgerDevices()
      .filter(device => !!device.path)
      .map(d => ({ ...d, path: d.path as string }))

    // attached devices are ones where a currently connected device
    // is not yet one of the currently known signers
    const attachedDevices = ledgerDevices
      .filter(device => !knownDevicePaths.includes(device.path))

    // detached Ledgers are ones where the known signer is no longer one of the
    // connected ledger devices
    const detachedLedgers = this.knownSigners.filter(signer =>
      !ledgerDevices.some(device => device.path === signer.devicePath)
    )

    // if any disconnected devices have been reconnected using the same device path, mark them
    // as reconnected Ledgers, not newly attached devices
    attachedDevices.forEach(device => {
      const devicePath = device.path
      const disconnectionIndex = this.disconnections.findIndex(d => d.device.devicePath === devicePath)

      if (disconnectionIndex > -1) {
        const disconnection = this.disconnections.splice(disconnectionIndex, 1)[0]
        
        clearTimeout(disconnection.timeout)
        reconnectedLedgers.push(disconnection.device)
        attachedDevices.splice(attachedDevices.findIndex(device => device.path === devicePath), 1)
      }
    })

    // if more devices have been added and we are still waiting on reconnections,
    // assume that these are the reconnection events, this mostly happens on Windows because
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
