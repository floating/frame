declare module 'eth-provider' {
  interface ProviderOpts {
    name?: string,
    origin?: string
  }
  
  interface RequestPayload {
    id?: number
    jsonrpc?: string
    method: string
    params?: any[]
    chainId?: string
  }

  interface EthereumProvider extends NodeJS.EventEmitter {
    private readonly connection
    private readonly eventHandlers
    private readonly promises
    private readonly attemptedSubscriptions
    private subscriptions
    private networkVersion?
    private manualChainId?
    private providerChainId?
    private checkConnectionRunning
    private checkConnectionTimer?
    private nextId
    connected: boolean
    accounts: string[]
    selectedAddress: string
    coinbase: string
    constructor(connection: Connection)
    get chainId(): string | undefined
    checkConnection(retryTimeout?: number): Promise<void>
    private attemptedSubscription
    private setSubscriptionAttempted
    startSubscription(event: string): Promise<void>
    private resumeSubscriptions
    enable(): Promise<string[]>
    private doSend
    send(methodOrPayload: string | Payload, callbackOrArgs: Callback<Response> | unknown[]): Promise<unknown>
    private sendBatch
    subscribe(type: string, method: string, params?: never[]): Promise<string>
    unsubscribe(type: string, id: string): Promise<true | undefined>
    sendAsync(rawPayload: Payload | Payload[], cb: Callback<Response> | Callback<Response[]>): Promise<void | Error>
    private sendAsyncBatch
    isConnected(): boolean
    close(): void
    request<T>(payload: Payload): Promise<T>
    setChain(chainId: string | number): void
  }

  export default function provider (targets?: string | string[], opts?: ProviderOpts): EthereumProvider
}
