import { JsonTx } from '@ethereumjs/tx'
import { addHexPrefix, isHexString } from '@ethereumjs/util'

export enum GasFeesSource {
  Dapp = 'Dapp',
  Frame = 'Frame'
}

export interface TransactionData extends Omit<JsonTx, 'chainId' | 'type'> {
  warning?: string
  gas?: string
  from?: string
  feesUpdated?: boolean
  chainId: string
  type: string
  gasFeesSource: GasFeesSource
  recipientType?: string
}

export function typeSupportsBaseFee(type: string) {
  return parseInt(type || '0') === 2
}

export function usesBaseFee(rawTx: TransactionData) {
  return typeSupportsBaseFee(rawTx.type)
}

function parseChainId(chainId: string) {
  if (isHexString(chainId)) {
    return parseInt(chainId, 16)
  }

  return Number(chainId)
}

// TODO: move this into requests parsing module
export function normalizeChainId(tx: RPC.SendTransaction.TxParams, targetChain?: number) {
  if (!tx.chainId) return tx

  const chainId = parseChainId(tx.chainId)

  if (!chainId) {
    throw new Error(`Chain for transaction (${tx.chainId}) is not a hex-prefixed string`)
  }

  if (targetChain && targetChain !== chainId) {
    throw new Error(
      `Chain for transaction (${tx.chainId}) does not match request target chain (${targetChain})`
    )
  }

  return {
    ...tx,
    chainId: addHexPrefix(chainId.toString(16))
  }
}
