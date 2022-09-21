import { EventEmitter } from 'stream'

class ProviderProxyConnection extends EventEmitter {
  constructor () {
    super()

    process.nextTick(() => this.emit('connect'))
  }

  async send (payload: JSONRPCRequestPayload) {
    this.emit('provider:send', payload)
  }

  close () {
    this.emit('close')
  }
}

export default new ProviderProxyConnection()
