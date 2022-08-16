
import log from 'electron-log'
import proxyConnection from '../../provider/proxy'
// @ts-ignore
import EthereumProvider from 'ethereum-provider'

const provider = new EthereumProvider(proxyConnection)
// TODO: Discuss the need to set chain for the proxy connection
provider.setChain('0x1')

export default {
  getType: async (to: string | undefined, chainId: string)  => { 
    if (!to) return ''
    try {
      const payload: JSONRPCRequestPayload = {
        method: 'eth_getCode',
        params: [to, 'latest'],
        jsonrpc: '2.0',
        id: 1,
        chainId
      }      
      const code = (await provider.request(payload) || [])[0]
      const type = code === '0x' ? 'external' : 'contract'
      return type
    } catch (e) {
      log.warn(e)
      return ''
    }
  }
}
