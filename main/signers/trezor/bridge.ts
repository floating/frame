import log from 'electron-log'
import { EventEmitter } from 'events'
import { resolve } from 'path'
import TrezorConnect, { Device, DEVICE, DEVICE_EVENT, Response, UI, UiEvent, UiResponse, UI_EVENT } from 'trezor-connect'

export type ConnectError = { error: string, code?: string }

const manifest = { email: 'dev@frame.sh', appUrl: 'https://frame.sh' }

const config = {
  manifest,
  popup: false,
  webusb: false,
  debug: false,
  lazyLoad: true
}

async function handleResponse <T> (p: Response<T>) {
  return p.then(response => {
    if (response.success) return response.payload
    throw response.payload
  })
}

// handles connection and state management for Trezor devices
class TrezorBridge extends EventEmitter {
  async open () {
    TrezorConnect.on(UI_EVENT, e => {
      log.debug('received Trezor ui event', { e })

      if (e.type === UI.REQUEST_PIN) {
        this.emit('trezor:needPin', e.payload.device)
      } else if (e.type === UI.REQUEST_PASSPHRASE) {
        const device = e.payload.device
        const capabilities = (device.features || {}).capabilities || []

        if (capabilities.includes('Capability_PassphraseEntry')) {
          this.emit('trezor:enteringPhrase')
        } else {
          this.emit('trezor:needPhrase', device)
        }
      }
    })

    TrezorConnect.on(DEVICE_EVENT, e => {
      log.debug('received Trezor device event', { e })

      if ((e.type === DEVICE.CHANGED || e.type === DEVICE.CONNECT_UNACQUIRED) && e.payload.type === 'unacquired') {
        // device is detected but not connected, either because
        // a session is already active or that the connection has just not
        // been made yet
        this.emit('trezor:detected', e.payload.path)
      } else if (e.type === DEVICE.CONNECT && e.payload.type === 'acquired') {
        this.emit('trezor:connect', e.payload)
      } else if (e.type === DEVICE.DISCONNECT) {
        this.emit('trezor:disconnect', e.payload)
      } else if (e.type === DEVICE.CHANGED) {
        if (e.payload.state) {
          // this is only present once a session is started after a passphrase is entered
          this.emit('trezor:sessionStart', e.payload)
        }
      }
    })

    try {
      await TrezorConnect.init(config)

      log.info('Trezor Connect initialized')

      this.emit('connect')

      // this will force the lazy loading of Trezor devices and
      // start the flow of events
      TrezorConnect.getFeatures()
    } catch (e) {
      log.error('could not open TrezorConnect!', e)
    }
  }

  close () {
    this.removeAllListeners()

    TrezorConnect.removeAllListeners()
    TrezorConnect.dispose()
  }

  async getPublicKey (path: string, device?: Device) {
    return handleResponse(TrezorConnect.getPublicKey({ path, device }))
  }

  async pinEntered (deviceId: string, pin: string) {
    log.debug('pin entered for device', deviceId)

    this.waitForUiResponse(deviceId, 'trezor:entered:pin', { type: UI.RECEIVE_PIN, payload: pin })
  }

  async passphraseEntered (deviceId: string, phrase: string) {
    log.debug('passphrase entered for device', deviceId)

    this.waitForUiResponse(deviceId, 'trezor:entered:passphrase', { type: UI.RECEIVE_PASSPHRASE, payload: { save: true, value: phrase } })
  }

  private waitForUiResponse (deviceId: string, eventType: string, response: UiResponse) {
    return new Promise<void>((resolve, reject) => {
      const entered = (event: UiEvent) => {
        if (event.type === UI.CLOSE_UI_WINDOW) {
          TrezorConnect.off(UI_EVENT, entered)
          this.emit(eventType, deviceId)
          resolve()
        }
      }
  
      setTimeout(() => {
        TrezorConnect.off(UI_EVENT, entered)
        reject('request timed out')
      }, 60 * 1000)
  
      TrezorConnect.on(UI_EVENT, entered)
      TrezorConnect.uiResponse(response)
    })
  }
}

export default new TrezorBridge()
