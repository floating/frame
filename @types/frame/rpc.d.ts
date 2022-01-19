type RPCResponsePayload = JSONRPCSuccessResponsePayload & JSONRPCErrorResponsePayload

type RPCCallback<T extends RPCResponsePayload> = (res: T) => void
type RPCErrorCallback = RPCCallback<JSONRPCErrorResponsePayload>
type RPCSuccessCallback = RPCCallback<JSONRPCSuccessResponsePayload>
type RPCRequestCallback = RPCCallback<RPCResponsePayload>

type Address = string // 20 hex bytes, 0x-prefixed
enum SubscriptionType {
  ACCOUNTS = 'accountsChanged',
  ASSETS = 'assetsChanged',
  CHAIN = 'chainChanged',
  CHAINS = 'chainsChanged',
  NETWORK = 'networkChanged'
}

interface RPCId {
  id: number,
  jsonrpc: string
}

interface InternalPayload {
  _origin: string,
  chainId?: string
}

interface JSONRPCRequestPayload extends RPCId {
  params: any[],
  method: string
}

interface JSONRPCSuccessResponsePayload extends RPCId {
  result?: any
}

interface JSONRPCErrorResponsePayload extends RPCId {
  error?: EVMError
}

interface EVMError {
  message: string,
  code?: number
}

type RPCRequestPayload = JSONRPCRequestPayload & InternalPayload

declare namespace RPC {
  namespace GetAssets {
    interface Balance {
      chainId: number,
      name: string,
      symbol: string,
      balance: string,
      decimals: number,
      displayBalance: string
    }

    interface NativeCurrency extends Balance {
      currencyInfo: Currency
    }
    
    interface Erc20 extends Balance {
      tokenInfo: {
        lastKnownPrice: { usd: { price: number, change24hr?: number } }
      },
      address: Address
    }

    interface Assets {
      erc20?: Erc20[],
      nativeCurrency: Balance[]
    }

    interface Request extends Omit<RPCRequestPayload, 'method'> {
      method: 'wallet_getAssets'
    }

    interface Response extends Omit<RPCResponsePayload, 'result'> {
      result?: Assets
    }
  }

  namespace SendTransaction {
    interface TxParams {
      nonce?: string;
      gasPrice?: string,
      gas?: string, // deprecated
      maxPriorityFeePerGas?: string,
      maxFeePerGas?: string,
      gasLimit?: string,
      from?: Address,
      to?: Address,
      data?: string,
      value?: string,
      chainId?: string,
      type?: string,
    }

    interface Request extends Omit<RPCRequestPayload, 'method'> {
      method: 'eth_sendTransaction',
      params: TxParams[]
    }
  }

  namespace Subscribe {
    interface Request extends Omit<RPCRequestPayload, 'method'> {
      method: 'eth_subscribe',
      params: SubscriptionType[]
    }
  }
}
