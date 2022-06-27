import { EventEmitter } from 'stream'

class ProviderProxyConnection extends EventEmitter {
  constructor() {
    super()

    process.nextTick(() => this.emit('connect'))
  }

  async send(payload: RPCRequestPayload) {
    this.emit('provider:send', payload)
  }
}

export default new ProviderProxyConnection()
