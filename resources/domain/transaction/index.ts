import { JsonTx } from '@ethereumjs/tx'
import { getAddress as getChecksumAddress } from '@ethersproject/address'

export enum GasFeesSource {
  Dapp = 'Dapp',
  Frame = 'Frame'
}

export interface TransactionData extends Omit<JsonTx, 'chainId' | 'type'> {
  warning?: string,
  gas?: string,
  from?: string,
  feesUpdated?: boolean,
  chainId: string,
  type: string,
  gasFeesSource: GasFeesSource,
}

export function typeSupportsBaseFee (type: string) {
  return parseInt(type || '0') === 2
}

export function usesBaseFee (rawTx: TransactionData) {
  return typeSupportsBaseFee(rawTx.type)
}

export function getAddress (address: Address) {
  const lowerCaseAddress = address.toLowerCase()

  try {
    // this will throw if the address can't be checksummed
    return getChecksumAddress(lowerCaseAddress)
  } catch (e) {
    console.warn(`could not checksum address ${address}, using lowercase address`, e)
    return lowerCaseAddress
  }
}
