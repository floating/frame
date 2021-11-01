declare module 'gridplus-sdk' {
  export class Client {
    constructor(options: ClientOptions);

    name: string;
    baseUrl: string;
    privKey: string;
    fwVersion: [number, number, number] | undefined;

    connect (deviceId: string | Callback, cb?: Callback);
    pair (pairingSecret: string, cb: Callback);
    getAddresses (opts: DerivationOptions, cb: Callback);
  }

  type Callback = (err: string | null, result: any | undefined) => void

  export interface ClientOptions {
    name?: string,
    baseUrl: string,
    privKey?: string,
    crypto: any,
    timeout?: number,
    retryCount?: number
  }

  export interface DerivationOptions {
    startPath: number[],
    n: number,
    skipCache?: boolean
  }
}
