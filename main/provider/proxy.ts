import log from 'electron-log'
import { EventEmitter } from 'stream'

// @ts-ignore
import EthereumProvider from 'ethereum-provider'

class ProviderProxyConnection extends EventEmitter {
  async send (payload: RPCRequestPayload) {
    try {
      this.emit('provider:send', payload)
    } catch (e) {
      log.error('error!', e)
    }
  }
}

const connection = new ProviderProxyConnection()

export default {
  connection,
  provider: new EthereumProvider(connection)
}
