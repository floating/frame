import { Version } from 'eth-sig-util'
import Account from './Account'

// TODO move this to accounts.js when it's converted to TS
export interface AccountRequest {
  origin: string,
  payload: JSONRPCRequestPayload,
  handlerId: string,
  account: string,
  data: any
}

export interface AddTokenRequest extends Omit<AccountRequest, 'data'> {
  type: 'addToken',
  token: Token
}

export interface AddChainRequest extends Omit<AccountRequest, 'data'> {
  type: 'addChain',
  chain: Chain
}

export interface TransactionRequest extends AccountRequest {
  warning?: string,
  feesUpdatedByUser: boolean
}

export interface SignTypedDataRequest extends Omit<AccountRequest, 'data'> {
  version: Version
}

export function signTypedData (version: string, address: string, dataToSign: any, cb: Callback<string>): void;
export function signMessage (address: string, message: string, cb: Callback<string>): void;
export function getAccounts (cb?: Callback<string[]>): string[];
export function getSelectedAddresses (): string[];
export function current(): Account;
export function get(id: string): Account;
export function addRequest(req: AccountRequest | AddTokenRequest | AddChainRequest | TransactionRequest | SignTypedDataRequest, cb?: (data: any) => void);
export function lockRequest(id: string);
