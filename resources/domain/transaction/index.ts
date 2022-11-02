import BigNumber from 'bignumber.js'
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

export function toUSD (bn: BigNumber, nativeCurrency: Rate, isTestnet = false) {
  const nativeUSD = nativeCurrency && nativeCurrency.usd && !isTestnet ? nativeCurrency.usd.price : 0
  const usd = bn.shiftedBy(-18).multipliedBy(nativeUSD).decimalPlaces(2, BigNumber.ROUND_FLOOR)

  return {
    usd,
    displayUSD: usd.isZero() ? '< $0.01' : `$${usd.toFormat()}`
  }
}

export function toEther (bn: BigNumber, decimalPlaces = 18) {
  const ether = bn.shiftedBy(-18).decimalPlaces(decimalPlaces, BigNumber.ROUND_FLOOR)

  return {
    ether,
    displayEther: decimalPlaces < 18 && ether.isZero() ? `< ${BigNumber(`1e-${decimalPlaces}`).toFormat()}` : ether.toFormat()
  }
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
