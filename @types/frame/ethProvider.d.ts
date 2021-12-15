declare module 'eth-provider' {
  interface ProviderOpts {
    name: string
  }
  
  interface RequestPayload {
    id?: number,
    jsonrpc?: '2.0',
    method: string,
    params?: any[],
    chain?: string
  }

  interface EthereumProvider extends NodeJS.EventEmitter {
    constructor()
    request(payload: RequestPayload);
  }

  export default function provider (targets?: string | string[], opts?: ProviderOpts): EthereumProvider
}
