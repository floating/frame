import { JsonTx } from '@ethereumjs/tx'
import { getAddress as getChecksumAddress } from '@ethersproject/address'
import { UnsignedTransaction } from 'ethers'
import { keccak256 } from 'ethers/lib/utils'
import { serialize } from '@ethersproject/transactions'

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

export function computePreImage(rawTx: UnsignedTransaction): string {
  const serialized = serialize(rawTx)
  return  keccak256(serialized)
}
