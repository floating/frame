declare module 'gridplus-sdk' {
  export = Client;

  class Client {
    constructor(options: ClientOptions);

    name: string;
    baseUrl: string;
    privKey: string;

    connect (deviceId: string | Callback, cb?: Callback)
  }

  type Callback = (err: string | null, result: any | undefined) => void

  interface ClientOptions {
    name?: string,
    baseUrl: string,
    privKey?: string,
    crypto?: any,
    timeout?: number,
    retryCount?: number
  }
}
