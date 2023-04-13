import { EventEmitter } from 'stream'

class ProviderProxyConnection extends EventEmitter {
  constructor() {
    super()

    process.nextTick(() => this.emit('connect'))
  }

  async send(payload: JSONRPCRequestPayload) {
    if (payload.method === 'eth_subscribe') {
      const { id, jsonrpc, params } = payload
      const subType = params[0] as string

      this.emit('provider:subscribe', { id, jsonrpc, params: [subType] })
    } else {
      this.emit('provider:send', payload)
    }
  }

  close() {
    this.emit('close')
  }
}

export default new ProviderProxyConnection()
