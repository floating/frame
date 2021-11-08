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
    getAddresses (opts: DerivationOptions, cb: Callback<Array<string>>);
    sign (opts: SigningOptions, cb: Callback<SignedData>)
  }

  type Callback<T> = (err: string | null, result: T | undefined) => void

  export type Signature = {
    v: Buffer,
    r: string,
    s: string
  }

  export type SignedData = {
    tx?: string,
    txHash?: string,
    changeRecipient?: string,
    sigs?: any[],
    sig?: Signature
  }

  interface ClientOptions {
    name?: string,
    baseUrl: string,
    privKey?: string,
    crypto: any,
    timeout?: number,
    retryCount?: number
  }

  interface DerivationOptions {
    startPath: number[],
    n: number,
    skipCache?: boolean
  }

  interface SigningOptions {
    currency: string,
    data: {
      protocol: string,
      payload: string,
      signerPath: number[]
    }
  }
}
