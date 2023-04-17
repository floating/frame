import { EventEmitter } from 'stream'
import { v5 as uuid } from 'uuid'

const internalOriginId = uuid('frame-internal', uuid.DNS)

class ProviderProxyConnection extends EventEmitter {
  constructor() {
    super()

    process.nextTick(() => this.emit('connect'))
  }

  async send(payload: JSONRPCRequestPayload) {
    if (payload.method === 'eth_subscribe') {
      this.emit('provider:subscribe', { ...payload, _origin: internalOriginId })
    } else {
      this.emit('provider:send', { ...payload, _origin: internalOriginId })
    }
  }

  close() {
    this.emit('close')
  }
}

export default new ProviderProxyConnection()
