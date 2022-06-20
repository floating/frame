import log from 'electron-log'

// @ts-ignore
import { v5 as uuid } from 'uuid'
import type { Device as TrezorDevice } from 'trezor-connect'

import { SignerAdapter } from '../adapters'
import Trezor, { Status } from './Trezor'
import store from '../../store'
import TrezorBridge from './bridge'

const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

function generateId (path: string) {
  return uuid('Trezor' + path, ns)
}

// handling specific events for a given signer
interface EventHandlers {
  [event: string]: (...args: any) => void
}

interface KnownSigner {
  signer: Trezor,
  eventHandlers: EventHandlers
}

export default class TrezorSignerAdapter extends SignerAdapter {
  private knownSigners: { [id: string]: KnownSigner } = {}
  private observer?: Observer

  constructor () {
    super('trezor')
  }

  open () {
    const scanListener = (err: any) => {
      if (err) return log.error(err)
    }

    const readyListener = () => {
      this.observer = store.observer(() => {
        const trezorDerivation = store('main.trezor.derivation')

        Object.values(this.knownSigners).forEach(signerInfo => {
          const trezor = signerInfo.signer
          if (trezor.derivation !== trezorDerivation) {
            trezor.derivation = trezorDerivation
            trezor.deriveAddresses()
          }
        })
      })
    }

    TrezorBridge.on('connect', readyListener)

    TrezorBridge.on('trezor:detected', (path: string) => {
      const id = generateId(path)
      const trezor = new Trezor(id, TrezorBridge)

      log.info(`Trezor ${trezor.id} detected`)

      trezor.on('close', () => {
        this.emit('remove', trezor.id)
      })

      trezor.on('update', () => {
        this.emit('update', trezor)
      })

      this.knownSigners[id] = { signer: trezor, eventHandlers: {} }

      this.emit('add', trezor)
    })

    TrezorBridge.on('trezor:connect', (device: TrezorDevice) => {
      const id = generateId(device.path)
      const trezor = this.knownSigners[id].signer

      trezor.derivation = store('main.trezor.derivation')
      trezor.open(device).then(() => {
        const version = [trezor.appVersion.major, trezor.appVersion.minor, trezor.appVersion.patch].join('.')
        log.info(`Trezor ${id} connected: ${trezor.model}, firmware v${version}`)
      })

      this.addEventHandler(trezor, 'trezor:sessionStart', (device: TrezorDevice) => {
        // update device with new session info, preventing future need to enter passphrase
        trezor.device = device
      })
    })

    TrezorBridge.on('trezor:disconnect', (device: TrezorDevice) => {
      log.info(`Trezor ${device.id} disconnected`)

      this.withSigner(device, signer => {
        this.remove(signer)
      })
    })

    TrezorBridge.on('trezor:sessionStart', (device: TrezorDevice) => {
      this.withSigner(device, signer => {
        log.info(`Trezor ${signer.id} session started`)
  
        this.handleEvent(signer.id, 'trezor:sessionStart', device)
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

    TrezorBridge.on('trezor:needPin', (device: TrezorDevice) => {
      log.verbose(`Trezor ${device.id} needs pin`)

      this.withSigner(device, signer => {
        const currentStatus = signer.status

        this.addEventHandler(signer, 'trezor:entered:pin', () => {
          signer.status = currentStatus
          signer.emit('update')
        })

        signer.status = Status.NEEDS_PIN
        signer.emit('update')
      })
    })

    TrezorBridge.on('trezor:needPhrase', (device: TrezorDevice) => {
      log.verbose(`Trezor ${device.id} needs passphrase`)

      this.withSigner(device, signer => {
        const currentStatus = signer.status

        this.addEventHandler(signer, 'trezor:entered:passphrase', () => {
          signer.status = currentStatus
          signer.emit('update')
        })
        
        signer.status = Status.NEEDS_PASSPHRASE
        signer.emit('update')
      })
    })

    TrezorBridge.on('trezor:enteringPhrase', (device: TrezorDevice) => {
      log.verbose(`Trezor ${device.id} waiting for passphrase entry on device`)

      this.withSigner(device, signer => {
        signer.status = Status.ENTERING_PASSPHRASE
        signer.emit('update')
      })
    })

    TrezorBridge.open()
    super.open()
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

    if (!trezor.device) {
      log.warn(`tried to reload disconnected Trezor ${trezor.id}`)
      return
    }

    trezor.open(trezor.device)
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
    const signer = this.knownSigners[generateId(device.path)].signer

    if (signer) fn(signer)
  }
}
