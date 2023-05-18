import { EventEmitter } from 'stream'
import { frameOriginId } from '../../resources/utils'

class ProviderProxyConnection extends EventEmitter {
  constructor() {
    super()

    process.nextTick(() => this.emit('connect'))
  }

  async send(payload: JSONRPCRequestPayload) {
    const newPayload = { ...payload, _origin: frameOriginId }
    if (payload.method === 'eth_subscribe') {
      this.emit('provider:subscribe', newPayload)
    } else {
      this.emit('provider:send', newPayload)
    }
  }

  close() {
    this.emit('close')
  }
}

export default new ProviderProxyConnection()
