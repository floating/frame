import log from 'electron-log'

import type { Device as TrezorDevice } from 'trezor-connect'

import { SignerAdapter } from '../adapters'
import Trezor, { Status } from './Trezor'
import store from '../../store'
import TrezorBridge from './bridge'

interface KnownSigners {
  [id: string]: {
    signer: Trezor,
    eventHandlers: {
      [event: string]: (...args: any) => void
    }
  }
}

export default class TrezorSignerAdapter extends SignerAdapter {
  private knownSigners: KnownSigners = {}
  private observer?: Observer

  constructor () {
    super('trezor')
  }

  open () {
    this.observer = store.observer(() => {
      const trezorDerivation = store('main.trezor.derivation')

      Object.values(this.knownSigners).forEach(signerInfo => {
        const trezor = signerInfo.signer
        if (trezor.derivation !== trezorDerivation) {
          trezor.derivation = trezorDerivation

          if (trezor.status === Status.OK) {
            trezor.deriveAddresses()
          }
        }
      })
    })

    TrezorBridge.on('trezor:detected', (path: string) => {
      // create a new signer whenever a Trezor is detected, but it won't be opened
      // until a connect event with an active device is received
      const id = Trezor.generateId(path)

      if (!this.knownSigners[id]) {
        this.initTrezor(path)
      }
    })

    TrezorBridge.on('trezor:connect', async (device: TrezorDevice) => {
      const id = Trezor.generateId(device.path)
      const trezor = this.knownSigners[id]?.signer || this.initTrezor(device.path)

      trezor.derivation = store('main.trezor.derivation')

      try {
        await trezor.open(device)

        const version = [trezor.appVersion.major, trezor.appVersion.minor, trezor.appVersion.patch].join('.')
        log.info(`Trezor ${trezor.id} connected: ${trezor.model}, firmware v${version}`)

        // arbitrary delay to attempt to minimize message conflicts on first connection
        setTimeout(() => trezor.deriveAddresses(), 200)
      } catch (e) {
        log.error('could not open Trezor', e)
      }
    })

    TrezorBridge.on('trezor:disconnect', (device: TrezorDevice) => {
      this.withSigner(device, signer => {
        log.info(`Trezor ${signer.id} disconnected`)

        this.remove(signer)
      })
    })

    TrezorBridge.on('trezor:update', (device: TrezorDevice) => {
      this.withSigner(device, signer => {
        log.debug(`Trezor ${signer.id} updated`)

        signer.device = device
      })
    })

    TrezorBridge.on('trezor:entered:pin', (deviceId: string) => {
      log.verbose(`Trezor ${deviceId} pin entered`)

      this.handleEvent(deviceId, 'trezor:entered:pin')
    })

    TrezorBridge.on('trezor:entered:passphrase', (deviceId: string) => {
      log.verbose(`Trezor ${deviceId} passphrase entered`)

      this.handleEvent(deviceId, 'trezor:entered:passphrase')
    })

    TrezorBridge.on('trezor:enteringPhrase', (deviceId: string) => {
      log.verbose(`Trezor ${deviceId} waiting for passphrase entry on device`)
      const signer = this.knownSigners[deviceId].signer

      // const currentStatus = signer.status

      // this.addEventHandler(signer, 'trezor:entered:passphrase', () => {
      //   signer.status = currentStatus
      //   this.emit('update', signer)
      // })

      signer.status = Status.ENTERING_PASSPHRASE
      this.emit('update', signer)
    })

    TrezorBridge.on('trezor:needPin', (device: TrezorDevice) => {
      this.withSigner(device, signer => {
        log.verbose(`Trezor ${signer.id} needs pin`)

        const currentStatus = signer.status

        this.addEventHandler(signer, 'trezor:entered:pin', () => {
          signer.status = currentStatus
          this.emit('update', signer)
        })

        signer.status = Status.NEEDS_PIN
        this.emit('update', signer)
      })
    })

    TrezorBridge.on('trezor:needPhrase', (device: TrezorDevice) => {
      this.withSigner(device, signer => {
        log.verbose(`Trezor ${signer.id} needs passphrase`, { status: signer.status })

        const currentStatus = signer.status

        this.addEventHandler(signer, 'trezor:entered:passphrase', () => {
          signer.status = currentStatus
          this.emit('update', signer)
        })
        
        signer.status = Status.NEEDS_PASSPHRASE
        this.emit('update', signer)
      })
    })

    TrezorBridge.open()
    super.open()
  }

  private initTrezor (path: string) {
    const trezor = new Trezor(path)

    log.info(`Trezor ${trezor.id} detected`)

    trezor.on('close', () => {
      this.emit('remove', trezor.id)
    })

    trezor.on('update', () => {
      this.emit('update', trezor)
    })

    this.knownSigners[trezor.id] = { signer: trezor, eventHandlers: {} }

    this.emit('add', trezor)

    // Show signer in dash window
    store.navReplace('dash', [
      {
        view: 'expandedSigner', 
        data: { signer: trezor.id }
      },
      {
        view: 'accounts',
        data: {}
      }
    ])

    setTimeout(() => {
      if (trezor.status === Status.INITIAL && !trezor.device) {
        // if the trezor hasn't connected in a reasonable amount of time, consider it disconnected
       trezor.status = Status.DISCONNECTED
       this.emit('update', trezor)
      }
    }, 10_000)

    return trezor
  }

  close () {
    if (this.observer) {
      this.observer.remove()
      this.observer = undefined
    }

    TrezorBridge.close()

    super.close()
  }

  remove (trezor: Trezor) {
    if (trezor.id in this.knownSigners) {
      log.info(`removing Trezor ${trezor.id}`)

      delete this.knownSigners[trezor.id]

      trezor.close()
    }
  }

  reload (trezor: Trezor) {
    log.info(`reloading Trezor ${trezor.id}`)

    trezor.status = Status.INITIAL
    this.emit('update', trezor)

    if (trezor.device) {
      // this Trezor is already open, just reset and derive addresses again
      trezor.open(trezor.device).then(() => trezor.deriveAddresses())
    } else {
      // this Trezor is not open because it was never connected,
      // attempt to force a reload by calling this method
      TrezorBridge.getFeatures({ device: { path: trezor.path } })
    }
  }

  private addEventHandler (signer: Trezor, event: string, handler: (device: TrezorDevice) => void) {
    this.knownSigners[signer.id].eventHandlers[event] = handler
  }

  private handleEvent (signerId: string, event: string, ...args: any) {
    const action = this.knownSigners[signerId]?.eventHandlers[event] || (() => {})

    delete this.knownSigners[signerId].eventHandlers[event]

    action(args)
  }

  private withSigner (device: TrezorDevice, fn: (signer: Trezor) => void) {
    const signer = this.knownSigners[Trezor.generateId(device.path)]?.signer

    if (signer) fn(signer)
  }
}
