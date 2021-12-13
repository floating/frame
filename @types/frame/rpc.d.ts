type RPCCallback<T> = (res: T) => void;
type RPCRequestCallback = RPCCallback<JSONRPCResponsePayload>

type Address = string // 20 hex bytes, 0x-prefixed
enum SubscriptionType {
  ACCOUNTS = 'accountsChanged',
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
  chain?: string
}

interface JSONRPCRequestPayload extends RPCId {
  params: any[],
  method: string
}

interface JSONRPCResponsePayload extends RPCId {
  result?: any,
  error?: EVMError
}

interface EVMError {
  message: string,
  code?: number
}

type RPCRequestPayload = JSONRPCRequestPayload & InternalPayload

declare namespace RPCRequests {
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

  interface SendTransaction extends RPCRequestPayload {
    method: 'eth_sendTransaction',
    params: TxParams[]
  }

  interface Subscribe extends RPCRequestPayload {
    method: 'eth_subscribe',
    params: [SubscriptionType]
  }

  interface Unsubscribe extends RPCRequestPayload {
    method: 'eth_unsubscribe',
    params: [string]
  }
}
