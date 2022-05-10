import { EventEmitter } from 'stream'

// @ts-ignore
import EthereumProvider from 'ethereum-provider'

class ProviderProxyConnection extends EventEmitter {
  async send (payload: RPCRequestPayload) {
    this.emit('provider:send', payload)
  }
}

const connection = new ProviderProxyConnection()

export default {
  connection,
  provider: new EthereumProvider(connection)
}
