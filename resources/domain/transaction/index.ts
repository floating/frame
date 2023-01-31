import { JsonTx } from '@ethereumjs/tx'

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
}

export function isNonZeroHex(hex: string) {
  return !!hex && !['0x', '0x0'].includes(hex)
}
export function typeSupportsBaseFee(type: string) {
  return parseInt(type || '0') === 2
}

export function usesBaseFee(rawTx: TransactionData) {
  return typeSupportsBaseFee(rawTx.type)
}
