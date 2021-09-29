// @ts-nocheck

import usb from 'usb'
import log from 'electron-log'
import Eth from '@ledgerhq/hw-app-eth'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'

import { UsbSignerAdapter } from '../adapters'
import Ledger from './Ledger'
import store from '../../store'

const supportedPlatforms = ['win32', 'darwin']

const STATUS = {
  OK: 'ok',
  LOCKED: 'Please unlock your ledger',
  WRONG_APP: 'Open your Ledger and select the Ethereum application',
  DISCONNECTED: 'Please reconnect this Ledger device'
}

async function checkEthAppIsOpen (ledger) {
  return ledger.getAddress("44'/60'/0'/0", false, false)
}

function isDeviceAsleep (err: { statusCode: number }) {
  return [27404].includes(err.statusCode)
}

function needToOpenEthApp (err: { statusCode: number }) {
  return [27904, 27906, 25873].includes(err.statusCode)
}

function getStatusForError (err: { statusCode: number }) {
  if (needToOpenEthApp(err)) {
    return STATUS.WRONG_APP
  }
  
  if (isDeviceAsleep(err)) {
    return STATUS.LOCKED
  }

  return STATUS.DISCONNECTED
}

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
    super.open()

    this.observer = store.observer(() => {
      const ledgerDerivation = store('main.ledger.derivation')
      const liveAccountLimit = store('main.ledger.liveAccountLimit')

      Object.values(this.knownSigners).forEach(ledger => {
        if (
          ledger.derivation !== ledgerDerivation || 
          (ledger.derivation === 'live' && ledger.liveAccountLimit !== liveAccountLimit)
        ) {
          ledger.derivation = ledgerDerivation
          ledger.liveAccountLimit = liveAccountLimit

          checkEthAppIsOpen(ledger)
            .then(() => ledger.deriveAddresses(liveAccountLimit))
            .catch(() => {})
        }
      })
    })
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

    if (!(deviceId in this.knownSigners)) {
      this.knownSigners[deviceId] = new Ledger(devicePath)
      this.emit('add', this.knownSigners[deviceId])
    }

    const ledger = this.knownSigners[deviceId]
    const emitUpdate = () => this.emit('update', ledger)

    try {
      await ledger.connect()
      await checkEthAppIsOpen(ledger)

      ledger.on('addresses', () => {
        ledger.status = STATUS.OK
        emitUpdate()
      })

      ledger.on('status', emitUpdate)

      const derivation = store('main.ledger.derivation')
      ledger.derivation = derivation

      const accountLimit = derivation === 'live' ? store('main.ledger.liveAccountLimit') : 0
      await ledger.deriveAddresses(accountLimit)

      let statusCheck = this.startStatusCheck(ledger, 10000)

      ledger.on('unlock', () => {
        clearInterval(statusCheck)
        statusCheck = this.startStatusCheck(ledger, 10000)
      })

      ledger.on('lock', () => {
        clearInterval(statusCheck)
        statusCheck = this.startStatusCheck(ledger, 500)
      })

      ledger.on('close', () => {
        clearInterval(statusCheck)
      })
    } catch (err) {
      ledger.status = getStatusForError(err)
      emitUpdate()
    }
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

  startStatusCheck (ledger, interval) {
    return setInterval(() => {
      checkEthAppIsOpen(ledger)
      .then(() => {
        if (ledger.status === STATUS.LOCKED) {
          ledger.status = STATUS.OK
          ledger.emit('unlock')

          this.emit('update', ledger)
        }
      })
      .catch(err => {
        if (isDeviceAsleep(err) && ledger.status !== STATUS.LOCKED) {
          ledger.status = STATUS.LOCKED
          ledger.emit('lock')

          this.emit('update', ledger)
        }
      })
    }, interval)
  }
}
