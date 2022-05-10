// @ts-ignore
import log from 'electron-log';


import { EventEmitter } from "stream";

class ProviderProxyConnection extends EventEmitter {
  async send (payload: RPCRequestPayload) {
    try {
      this.emit('provider:send', payload)
    } catch (e) {
      log.error('error!', e)
    }
  }
}

export default new ProviderProxyConnection()
