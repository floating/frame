import log from 'electron-log'
import { EventEmitter } from 'events'
import TrezorConnect, { Device, DEVICE, DeviceEvent, DEVICE_EVENT, EthereumSignTransaction, EthereumSignTypedDataMessage, EthereumSignTypedDataTypes, EthereumTransaction, EthereumTransactionEIP1559, Response, UI, UiEvent, UI_EVENT } from 'trezor-connect'

export class ConnectError extends Error {
  private readonly code

  constructor (msg: string, code?: string) {
    super(msg)

    this.code = code
  }
}

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
    throw { message: response.payload.error, code: response.payload.code }
  })
}

// handles connection and state management for Trezor devices
class TrezorBridge extends EventEmitter {
  async open () {
    TrezorConnect.on(DEVICE_EVENT, this.handleDeviceEvent.bind(this))
    TrezorConnect.on(UI_EVENT, this.handleUiEvent.bind(this))

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

  // methods to send requests from the application to a Trezor device
  async getPublicKey (device: Device, path: string) {
    return this.makeRequest(() => TrezorConnect.getPublicKey({ path, device }))
  }

  async getAddress (device: Device, path: string, display = false) {
    return this.makeRequest(() => TrezorConnect.ethereumGetAddress({
      device,
      path,
      showOnTrezor: display
    })).then(result => (result.address || '').toLowerCase())
  }

  async signMessage (device: Device, path: string, message: string) {
    return this.makeRequest(() => TrezorConnect.ethereumSignMessage({
      device,
      path,
      message,
      hex: true
    })).then(result => result.signature)
  }

  async signTypedData (device: Device, path: string, data: any) {
    return this.makeRequest(() => TrezorConnect.ethereumSignTypedData({
      device,
      path,
      data,
      metamask_v4_compat: true,
    })).then(result => result.signature)
  }

  async signTypedHash (device: Device, path: string, data: any, domainSeparatorHash: string, messageHash: string) {
    return this.makeRequest(() => TrezorConnect.ethereumSignTypedData({
      device,
      path,
      data,
      domain_separator_hash: domainSeparatorHash,
      message_hash: messageHash,
      metamask_v4_compat: true
    })).then(result => result.signature)
  }

  async signTransaction (device: Device, path: string, tx: any) {
    return this.makeRequest(() => TrezorConnect.ethereumSignTransaction({
      device,
      path,
      transaction: tx
    })).then(result => {
      const { v, r, s } = result
      return { v, r, s }
    })
  }

  async pinEntered (deviceId: string, pin: string) {
    log.debug('pin entered for device', deviceId)

    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin })

    this.emit('trezor:entered:pin', deviceId)
  }

  async makeRequest <T> (fn: () => Response<T>) {
    try {
      const result = await handleResponse(fn())
      return result
    } catch (e: any) {
      if (e.code === 'Device_CallInProgress') {
        return new Promise<T>(resolve => {
          setTimeout(() => {
            log.warn('request conflict, trying again in 200ms', e)
            resolve(this.makeRequest(fn))
          }, 200)
        })
      } else {
        throw e
      }
    }
  }

  async passphraseEntered (deviceId: string, phrase: string) {
    log.debug('passphrase entered for device', deviceId)

    return new Promise<void>((resolve, reject) => {
      const entered = (event: UiEvent) => {
        // a close window event will always be received after the passphrase is entered
        if (event.type === UI.CLOSE_UI_WINDOW) {
          TrezorConnect.off(UI_EVENT, entered)
          this.emit('trezor:entered:passphrase', deviceId)
          resolve()
        }
      }
  
      setTimeout(() => {
        TrezorConnect.off(UI_EVENT, entered)
        reject('request timed out')
      }, 60 * 1000)
  
      TrezorConnect.on(UI_EVENT, entered)
      TrezorConnect.uiResponse({ type: UI.RECEIVE_PASSPHRASE, payload: { save: true, value: phrase } })
    })
  }

  // listeners for events coming from a Trezor device
  private handleDeviceEvent (e: DeviceEvent) {
    log.debug('received Trezor device event', { e })

    if ((e.type === DEVICE.CHANGED || e.type === DEVICE.CONNECT_UNACQUIRED) && e.payload.type === 'unacquired') {
      // device is detected but not connected, either because
      // another session is already active or that the connection 
      // has just not been made yet
      this.emit('trezor:detected', e.payload.path)
    } else if (e.type === DEVICE.CONNECT && e.payload.type === 'acquired') {
      this.emit('trezor:connect', e.payload)
    } else if (e.type === DEVICE.DISCONNECT) {
      this.emit('trezor:disconnect', e.payload)
    } else if (e.type === DEVICE.CHANGED) {
      // update the device to remember things like passphrases and other session info
      this.emit('trezor:update', e.payload)
    }
  }

  private handleUiEvent (e: UiEvent) {
    log.debug('received Trezor ui event', { e })

    if (e.type === UI.REQUEST_PIN) {
      this.emit('trezor:needPin', e.payload.device)
    } else if (e.type === UI.REQUEST_PASSPHRASE) {
      const device = e.payload.device
      const capabilities = (device.features || {}).capabilities || []

      if (capabilities.includes('Capability_PassphraseEntry')) {
        this.emit('trezor:enteringPhrase', e.payload.device)

        TrezorConnect.uiResponse({
          type: UI.RECEIVE_PASSPHRASE,
          payload: { value: '', passphraseOnDevice: true, save: true }
        })
      } else {
        this.emit('trezor:needPhrase', device)
      }
    }
  }
}

export default new TrezorBridge()
