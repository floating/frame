import { EventEmitter } from 'stream'
import log from 'electron-log'

class ProviderProxyConnection extends EventEmitter {
  constructor () {
    super()

    log.info('proxy init')

    process.nextTick(() => {
      log.info('proxy connect')
      return this.emit('connect')
    })
  }

  async send (payload: RPCRequestPayload) {
    log.info('proxy send', payload)
    this.emit('provider:send', payload)
  }
}

export default new ProviderProxyConnection()
