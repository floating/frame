declare module '@aragon/wrapper' {
  interface WrapperOptions {
    provider: any
    apm?: {
      ipfs?: {
        gateway: string
      }
      ensRegistryAddress?: string
    }
  }

  interface App {
    appId: string
    proxyAddress: string
    name: string
    kernel: string
    agent: string
  }

  interface Subscription {
    unsubscribe: () => void
  }

  interface Apps {
    subscribe: (apps: (a: App[]) => void) => Subscription
  }

  export default class Wrapper {
    constructor(address: string, opts: WrapperOptions)
    apps: Apps

    init(): Promise<void>
    calculateTransactionPath(
      from: string,
      destination: string,
      action: string,
      txData: Array<string | undefined>
    ): Promise<Array<TransactionData>>
  }

  interface ResolveOptions {
    provider: any
    registryAddress?: string
  }

  export function ensResolve(domain: string, opts: ResolveOptions): Promise<string>
}
