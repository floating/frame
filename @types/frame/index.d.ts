type Callback<T> = (err: Error | null, result?: T) => void;
type RPCCallback<T> = (res: T) => void;
type RPCRequestCallback = RPCCallback<RPCResponsePayload>

interface JSONRPC {
  id: number,
  jsonrpc: string
}

interface JSONRPCRequestPayload extends JSONRPC {
  params: any[],
  method: string
}

interface RPCRequestPayload extends JSONRPCRequestPayload {
  _origin: string,
  chain?: string
}

interface JSONRPCResponsePayload extends JSONRPC {
  result?: any,
  error?: EVMError
}

interface EVMError {
  message: string,
  code?: number
}
