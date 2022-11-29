import { getAddress as getChecksumAddress } from '@ethersproject/address'
import { UnsignedTransaction } from 'ethers'
import { keccak256 } from 'ethers/lib/utils'
import { serialize } from '@ethersproject/transactions'
import { hexToInt } from '../../utils'

export enum GasFeesSource {
  Dapp = 'Dapp',
  Frame = 'Frame'
}

type JsonAccessListItem = { address: string; storageKeys: string[] }

interface JsonTx {
  nonce?: string
  gasPrice?: string
  gasLimit?: string
  to?: string
  data?: string
  v?: string
  r?: string
  s?: string
  value?: string
  chainId?: string
  accessList?: JsonAccessListItem[]
  type?: string
  maxPriorityFeePerGas?: string
  maxFeePerGas?: string
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

export function getAddress(address: string) {
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

export function convertToUnsignedTransaction(tx: TransactionData): UnsignedTransaction {
  
  const {
    to,
    nonce: nonceHex = '0x00',
    gasLimit,
    gasPrice,
    data = '0x',
    value,
    chainId: chainIdHex,
    type: typeHex = '0x00',
    accessList,
    maxPriorityFeePerGas,
    maxFeePerGas
} = tx

  const type = hexToInt(typeHex)

  const unsignedTx: UnsignedTransaction = {
    to,
    data,
    value,
    chainId: hexToInt(chainIdHex),
    type,
    nonce: hexToInt(nonceHex),
    gasLimit
  }
  
  if(type === 2){
    Object.assign(unsignedTx, {
      maxFeePerGas,
      maxPriorityFeePerGas
    })
  } else {
    Object.assign(unsignedTx, {
      gasPrice
    })
  }

  if(accessList && accessList.length) unsignedTx['accessList'] = accessList
  
  return unsignedTx
}
