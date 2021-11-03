declare module 'gridplus-sdk' {
  export class Client {
    constructor(options: ClientOptions);

    name: string;
    baseUrl: string;
    privKey: string;
    fwVersion: [number, number, number] | undefined;
    isPaired: boolean;

    connect (deviceId: string | Callback<boolean>, cb?: Callback<boolean>);
    pair (pairingSecret: string, cb: Callback<boolean>);
    getAddresses (opts: DerivationOptions, cb: Callback);
  }

  type Callback<T> = (err: string | null, result: T | undefined) => void

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
