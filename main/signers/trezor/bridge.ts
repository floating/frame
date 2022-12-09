import log from 'electron-log'
import { EventEmitter } from 'events'
import TrezorConnect, {
  CommonParams,
  Device,
  DeviceEvent,
  UiEvent,
  Response,
  DEVICE,
  DEVICE_EVENT,
  UI,
  UI_EVENT
} from 'trezor-connect'

export class DeviceError extends Error {
  readonly code

  constructor(msg: string, code?: string) {
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
  lazyLoad: false
}

async function handleResponse<T>(p: Response<T>) {
  const response = await p

  if (response.success) return response.payload
  const responseError = new Error(response.payload.error) as NodeJS.ErrnoException
  responseError.code = response.payload.code
  throw responseError
}

class TrezorBridge extends EventEmitter {
  async open() {
    TrezorConnect.on(DEVICE_EVENT, this.handleDeviceEvent.bind(this))
    TrezorConnect.on(UI_EVENT, this.handleUiEvent.bind(this))

    try {
      await TrezorConnect.init(config)

      log.info('Trezor Connect initialized')

      this.emit('connect')
    } catch (e) {
      log.error('could not open TrezorConnect!', e)
    }
  }

  close() {
    this.removeAllListeners()

    TrezorConnect.removeAllListeners()
    TrezorConnect.dispose()
  }

  // methods to send requests from the application to a Trezor device
  async getFeatures(params: CommonParams) {
    return this.makeRequest(() => TrezorConnect.getFeatures(params))
  }

  async getAccountInfo(device: Device, path: string) {
    return this.makeRequest(() => TrezorConnect.getAccountInfo({ device, path, coin: 'eth' }))
  }

  async getPublicKey(device: Device, path: string) {
    return this.makeRequest(() => TrezorConnect.getPublicKey({ device, path }))
  }

  async getAddress(device: Device, path: string, display = false) {
    const result = await this.makeRequest(() =>
      TrezorConnect.ethereumGetAddress({
        device,
        path,
        showOnTrezor: display
      })
    )

    return (result.address || '').toLowerCase()
  }

  async signMessage(device: Device, path: string, message: string) {
    const result = await this.makeRequest(() =>
      TrezorConnect.ethereumSignMessage({
        device,
        path,
        message,
        hex: true
      })
    )

    return result.signature
  }

  async signTypedData(device: Device, path: string, data: any) {
    const result = await this.makeRequest(() =>
      TrezorConnect.ethereumSignTypedData({
        device,
        path,
        data,
        metamask_v4_compat: true
      })
    )

    return result.signature
  }

  async signTypedHash(
    device: Device,
    path: string,
    data: any,
    domainSeparatorHash: string,
    messageHash: string
  ) {
    const result = await this.makeRequest(() =>
      TrezorConnect.ethereumSignTypedData({
        device,
        path,
        data,
        domain_separator_hash: domainSeparatorHash,
        message_hash: messageHash,
        metamask_v4_compat: true
      })
    )

    return result.signature
  }

  async signTransaction(device: Device, path: string, tx: any) {
    const result = await this.makeRequest(() =>
      TrezorConnect.ethereumSignTransaction({
        device,
        path,
        transaction: tx
      })
    )

    const { v, r, s } = result
    return { v, r, s }
  }

  pinEntered(deviceId: string, pin: string) {
    log.debug('pin entered for device', deviceId)

    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: pin })

    this.emit('trezor:entered:pin', deviceId)
  }

  passphraseEntered(deviceId: string, phrase: string) {
    log.debug('passphrase entered for device', deviceId)

    TrezorConnect.uiResponse({ type: UI.RECEIVE_PASSPHRASE, payload: { save: true, value: phrase } })

    this.emit('trezor:entered:passphrase', deviceId)
  }

  enterPassphraseOnDevice(deviceId: string) {
    log.debug('requested to enter passphrase on device', deviceId)

    TrezorConnect.uiResponse({
      type: UI.RECEIVE_PASSPHRASE,
      payload: { value: '', passphraseOnDevice: true, save: true }
    })

    this.emit('trezor:enteringPhrase', deviceId)
  }

  private async makeRequest<T>(fn: () => Response<T>, retries = 20) {
    try {
      const result = await handleResponse(fn())
      return result
    } catch (e: unknown) {
      if (retries === 0) {
        throw new Error('Trezor unreachable, please try again')
      }

      const err = e as DeviceError

      if (err.code === 'Device_CallInProgress') {
        return new Promise<T>((resolve) => {
          setTimeout(() => {
            log.warn('request conflict, trying again in 400ms', err)
            resolve(this.makeRequest(fn, retries - 1))
          }, 400)
        })
      } else {
        throw err
      }
    }
  }

  // listeners for events coming from a Trezor device
  private handleDeviceEvent(e: DeviceEvent) {
    log.debug('received Trezor device event', { e })

    if (
      (e.type === DEVICE.CHANGED || e.type === DEVICE.CONNECT_UNACQUIRED) &&
      e.payload.type === 'unacquired'
    ) {
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

  private handleUiEvent(e: UiEvent) {
    log.debug('received Trezor ui event', { e })

    if (e.type === UI.REQUEST_PIN) {
      this.emit('trezor:needPin', e.payload.device)
    } else if (e.type === UI.REQUEST_PASSPHRASE) {
      this.emit('trezor:needPhrase', e.payload.device)
    }
  }
}

export default new TrezorBridge()
