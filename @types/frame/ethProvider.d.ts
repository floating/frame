declare module 'eth-provider' {
  interface ProviderOpts {
    name?: string
    origin?: string
  }

  interface RequestPayload {
    id?: number
    jsonrpc?: '2.0'
    method: string
    params?: any[]
    chainId?: string
  }

  interface EthereumProvider extends NodeJS.EventEmitter {
    constructor()

    connected: boolean
    chainId: string
    request(payload: RequestPayload)
    setChain(chainId: string)
  }

  export default function provider(
    targets?: string | string[],
    opts?: ProviderOpts
  ): EthereumProvider
}
