// import { Version } from 'eth-sig-util'
// import { TransactionData } from '../transaction'
// import Account from './Account'

// // TODO move this to accounts.js when it's converted to TS
// export interface AccountRequest {
//   origin: string,
//   payload: JSONRPCRequestPayload,
//   handlerId: string,
//   account: string
// }

// export interface AddTokenRequest extends AccountRequest {
//   type: 'addToken',
//   token: Token
// }

// export interface AddChainRequest extends AccountRequest {
//   type: 'addChain',
//   chain: Chain
// }

// export interface SwitchChainRequest extends AccountRequest {
//   type: 'switchChain',
//   chain: Chain
// }

// export interface TransactionRequest extends AccountRequest {
//   type: 'transaction',
//   payload: RPCRequests.SendTransaction,
//   data: TransactionData,
//   warning?: string,
//   feesUpdatedByUser: boolean
// }

// export interface SignTypedDataRequest extends AccountRequest {
//   type: 'signTypedData',
//   version: Version
// }

// export function signTypedData (version: string, address: string, dataToSign: any, cb: Callback<string>): void;
// export function signMessage (address: string, message: string, cb: Callback<string>): void;
// export function getAccounts (cb?: Callback<string[]>): string[];
// export function getSelectedAddresses (): string[];
// export function current (): Account;
// export function get (id: string): Account;
// export function addRequest (req: AccountRequest | AddTokenRequest | AddChainRequest | SwitchChainRequest | TransactionRequest | SignTypedDataRequest, cb?: (data: any) => void): void;
// export function lockRequest (id: string): void;
// export function signTransaction (tx: TransactionData, cb: Callback<string>): void;
// export function setTxSigned (handlerId: string, cb: Callback<string>): void;
// export function updateNonce (handlerId: string, nonce: string): TransactionRequest;
