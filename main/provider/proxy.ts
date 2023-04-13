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

      this.emit('payload', { id, jsonrpc, method: 'eth_subscribe', result: `internal-${subType}` })
      return
    }

    this.emit('provider:send', payload)
  }

  close() {
    this.emit('close')
  }

  chainsChanged(chains: RPC.GetEthereumChains.Chain[]) {
    this.emit('payload', {
      method: 'eth_subscription',
      params: { result: chains, subscription: 'internal-chainsChanged' }
    })
  }
}

export default new ProviderProxyConnection()
