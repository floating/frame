import log from 'electron-log'

import flex from '../../flex'
import { SignerAdapter } from '../adapters'
import Trezor from './Trezor'
import store from '../../store'

export default class TrezorSignerAdapter extends SignerAdapter {
  private flexListeners: { [event: string]: (device: any) => void };
  private knownSigners: { [id: string]: Trezor };
  private observer: any;

  constructor () {
    super('trezor')

    this.flexListeners = {}
    this.knownSigners = {}
  }

  open () {
    const connectListener = (device: any) => {
      log.info(':: Trezor Scan - Connected Device')
      log.debug({ trezorDevice: device })

      const trezor = new Trezor(device)
      trezor.derivation = store('main.trezor.derivation')

      trezor.on('close', () => {
        delete this.knownSigners[device.path]

        this.emit('remove', trezor.id)
      })

      trezor.on('update', () => {
        this.emit('update', trezor)
      })

      this.knownSigners[device.path] = trezor

      this.emit('add', trezor)

      trezor.open()
    }

    const disconnectListener = (device: any) => {
      log.info(':: Trezor Scan - Disconnected Device')

      this.withSigner(device, signer => {
        signer.close()

        delete this.knownSigners[device.path]

        this.emit('remove', signer.id)
      })
    }

    const updateListener = (device: any) => {
      log.info(':: Trezor Scan - Updated Device')
      this.withSigner(device, signer => this.emit('update', signer))
    }

    const needPinListener = (device: any) => {
      log.info(':: Trezor Scan - Device Needs Pin')
      this.withSigner(device, signer => signer.needPin())
    }

    const needPhraseListener = (device: any) => {
      log.info(':: Trezor Scan - Device Needs Phrase')
      this.withSigner(device, signer => signer.needPhrase())
    }

    const scanListener = (err: any) => {
      if (err) return log.error(err)
    }

    const readyListener = () => {
      this.observer = store.observer(() => {
        const trezorDerivation = store('main.trezor.derivation')

        Object.values(this.knownSigners).forEach(trezor => {
          if (trezor.derivation !== trezorDerivation) {
            trezor.derivation = trezorDerivation
            trezor.reset()
            trezor.deviceStatus()
          }
        })
      })

      this.flexListeners = {
        'trezor:connect': connectListener,
        'trezor:disconnect': disconnectListener,
        'trezor:update': updateListener,
        'trezor:needPin': needPinListener,
        'trezor:needPhrase': needPhraseListener,
        'trezor:scan': scanListener
      }

      Object.entries(this.flexListeners).forEach(([event, listener]) => flex.on(event, listener))
    }

    flex.on('ready', readyListener)

    this.flexListeners.ready = readyListener

    super.open()
  }

  close () {
    this.observer.remove()

    Object.entries(this.flexListeners).forEach(([event, listener]) => flex.off(event, listener))

    super.close()
  }

  private withSigner (device: any, fn: (signer: Trezor) => void) {
    const signer = this.knownSigners[device.path]

    if (signer) {
      fn(signer)
    } else {
      log.warn('got Trezor Connect event for unknown signer', device)
    }
  }
}
