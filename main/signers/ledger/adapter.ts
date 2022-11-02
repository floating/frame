import log from 'electron-log'

import { getDevices as getLedgerDevices } from '@ledgerhq/hw-transport-node-hid-noevents'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-singleton'
import { Subscription } from '@ledgerhq/hw-transport'
import { Device } from 'node-hid'

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

type ConnectedDevice = Device & { path: string, product: string }

export default class LedgerSignerAdapter extends SignerAdapter {
  private knownSigners: { [devicePath: string]: Ledger };
  private disconnections: Disconnection[]

  private observer: any;
  private usbListener: Subscription | null = null;

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

    this.usbListener = TransportNodeHid.listen({
      next: evt => {
        log.debug(`received ${evt.type} USB event`)

        if (!evt.deviceModel) {
          log.warn('received USB event with no Ledger device model', evt)
          return
        }
        
        this.handleDeviceChanges()
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
      this.observer = null
    }

    if (this.usbListener) {
      this.usbListener.unsubscribe()
      this.usbListener = null
    }

    super.close()
  }

  remove (ledger: Ledger) {
    if (ledger.devicePath in this.knownSigners) {
      log.info(`removing Ledger ${ledger.model} attached at ${ledger.devicePath}`)

      delete this.knownSigners[ledger.devicePath]

      ledger.close()
    }
  }

  reload (ledger: Ledger) {
    log.info(`reloading  Ledger ${ledger.model} attached at ${ledger.devicePath}`)

    const signer = this.knownSigners[ledger.devicePath]

    if (signer) {
      signer.disconnect()
        .then(() => signer.open())
        .then(() => signer.connect())
    }
  }

  private handleDeviceChanges () {
    const {
      attachedDevices,
      detachedLedgers,
      reconnections,
      pendingDisconnections
    } = this.detectDeviceChanges()

    this.disconnections = pendingDisconnections

    detachedLedgers.forEach(ledger => this.handleDisconnectedDevice(ledger))
    reconnections.forEach(disconnection => this.handleReconnectedDevice(disconnection))
    attachedDevices.forEach(device => this.handleAttachedDevice(device))
  }

  private async handleAttachedDevice (device: ConnectedDevice) {
    log.info(`Ledger ${device.product} attached at ${device.path}`)

    const ledger = new Ledger(device.path, device.product)

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

    this.knownSigners[ledger.devicePath] = ledger

    this.emit('add', ledger)
    
    // Show signer in dash window
    store.navReplace('dash', [
      {
        view: 'expandedSigner', 
        data: { signer: ledger.id }
      },
      {
        view: 'accounts',
        data: {}
      }
    ])

    await this.handleConnectedDevice(ledger)
  }

  private async handleConnectedDevice (ledger: Ledger) {
    updateDerivation(ledger)

    await ledger.open()
    await ledger.connect()
  }

  private async handleReconnectedDevice (disconnection: Disconnection) {
    log.info(`Ledger ${disconnection.device.model} re-connected at ${disconnection.device.devicePath}`)

    clearTimeout(disconnection.timeout)

    this.handleConnectedDevice(disconnection.device)
  }

  handleDisconnectedDevice (ledger: Ledger) {
    log.info(`Ledger ${ledger.model} disconnected from ${ledger.devicePath}`)

    ledger.disconnect()

    // when a user exits the eth app, it takes a few seconds for the
    // main ledger to reconnect via USB, so attempt to wait for this event
    // instead of immediately removing the signer
    this.disconnections.push({
      device: ledger,
      timeout: setTimeout(() => {
        const index = this.disconnections.findIndex(d => d.device.devicePath === ledger.devicePath)
        this.disconnections.splice(index, 1)

        log.info(`Ledger ${ledger.model} detached from ${ledger.devicePath}`)

        this.remove(ledger)
      }, 5000)
    })
  }

  private detectDeviceChanges () {
    // all Ledger devices that are currently connected
    const ledgerDevices = getLedgerDevices()
      .filter(device => !!device.path)
      .map(d => ({ ...d, path: d.path as string, product: d.product || '' }))

    const { pendingDisconnections, reconnections } = this.getReconnectedLedgers(ledgerDevices)
    const detachedLedgers = this.getDetachedLedgers(ledgerDevices)
    const attachedDevices = this.getAttachedDevices(ledgerDevices).filter(device =>
      !reconnections.some(r => r.device.devicePath === device.path)
    )

    return {
      attachedDevices, detachedLedgers, pendingDisconnections, reconnections
    }
  }

  private getAttachedDevices (connectedDevices: ConnectedDevice[]) {
    // attached devices are ones where a connected device
    // is not yet one of the currently known signers
    return connectedDevices.filter(device => !(device.path in this.knownSigners))
  }

  private getDetachedLedgers (connectedDevices: ConnectedDevice[]) {
    // detached Ledgers are previously known signers that are
    // no longer one of the connected Ledger devices
    return Object.values(this.knownSigners).filter(signer =>
      !connectedDevices.some(device => device.path === signer.devicePath)
    )
  }

  private getReconnectedLedgers (connectedDevices: ConnectedDevice[]) {
    // group all the disconnections into ones that are either accounted for
    // by the currently connected devices (reconnections) or ones that are still
    // pending (pendingDisconnections)
    const {
      pendingDisconnections,
      reconnections
    } = this.disconnections.reduce((resolved, disconnection) => {
      if (connectedDevices.some(device => device.path === disconnection.device.devicePath)) {
        resolved.reconnections.push(disconnection)
      } else {
        resolved.pendingDisconnections.push(disconnection)
      }

      return resolved
    }, { pendingDisconnections: [] as Array<Disconnection>, reconnections: [] as Array<Disconnection> })

    // if we are still waiting on reconnections, check if any more devices have been added. if so, assume
    // that these are the reconnection events and allow any newly connected device to take the place
    // of a disconnected one. this mostly happens on Windows because the devices reconnect at a different
    // device path from the one from which they were disconnected
    while (pendingDisconnections.length > 0) {
      const reconnectedDevice = connectedDevices.find(device => 
        !reconnections.some(r => r.device.devicePath === device.path) &&
        !this.knownSigners[device.path]
      )

      if (reconnectedDevice) {
        const disconnection = pendingDisconnections.pop() as Disconnection
        this.knownSigners[reconnectedDevice.path] = disconnection.device
        delete this.knownSigners[disconnection.device.devicePath]

        disconnection.device.devicePath = reconnectedDevice.path

        reconnections.push(disconnection)
      } else break;
    }

    return { pendingDisconnections, reconnections }
  }
}
