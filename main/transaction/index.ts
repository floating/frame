import { BN, addHexPrefix, stripHexPrefix, bnToHex, intToHex } from 'ethereumjs-util'
import { JsonTx, TransactionFactory, TypedTransaction } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'

import chainConfig from '../chains/config'

const londonHardforkSigners: SignerCompatibilityByVersion = {
  seed: () => true,
  ring: () => true,
  ledger: version => version.major >= 2 || (version.major >= 1 && version.minor >= 9),
  lattice: version =>  version.major >= 1 || version.minor >= 11
}

type SignerCompatibilityByVersion = {
  [key: string]: (version: AppVersion) => boolean
}

interface Signature {
  v: string,
  r: string,
  s: string
}

export interface AppVersion {
  major: number,
  minor: number,
  patch: number
}

export interface RawTransaction { 
  chainId: string,
  type: string
}

export interface TransactionData extends JsonTx {
  warning?: string
  chainId: string,
  type: string
}

export interface SignerCompatibility  {
  signer: string,
  tx: string,
  compatible: boolean
}

export interface SignerSummary {
  id: string,
  name: string,
  type: string,
  addresses: string[],
  status: string,
  liveAddressesFound: number,
  appVersion: AppVersion
}

function toBN (hexStr: string) {
  return new BN(stripHexPrefix(hexStr), 'hex')
}

function signerCompatibility (txData: TransactionData, signer: SignerSummary): SignerCompatibility {
  if (typeSupportsBaseFee(txData.type)) {
    const compatible = (signer.type in londonHardforkSigners) && londonHardforkSigners[signer.type](signer.appVersion)
    return { signer: signer.type, tx: 'london', compatible }
  }

  return {
    signer: signer.type, tx: 'legacy', compatible: true
  }
}

function londonToLegacy (txData: TransactionData): TransactionData {
  if (txData.type === '0x2') {
    const { type, maxFeePerGas, maxPriorityFeePerGas, ...tx } = txData

    return { ...tx, type: '0x0', gasPrice: maxFeePerGas }
  }

  return txData
}

function typeSupportsBaseFee (type: string | undefined) {
  return parseInt(type || '0') === 2
}

function usesBaseFee (rawTx: RawTransaction) {
  return typeSupportsBaseFee(rawTx.type)
}

function populate (rawTx: RawTransaction, chainConfig: Common, gas: any): TransactionData {
  const txData: TransactionData = { ...rawTx }

  if (chainConfig.isActivatedEIP(1559)) {
    txData.type = intToHex(2)

    const maxPriorityFee = toBN(gas.price.fees.maxPriorityFeePerGas)
    const maxBaseFee = toBN(gas.price.fees.maxBaseFeePerGas)
    const maxFee = maxPriorityFee.add(maxBaseFee)

    txData.maxPriorityFeePerGas = bnToHex(maxPriorityFee)
    txData.maxFeePerGas = bnToHex(maxFee)
  } else {
    txData.type = intToHex(chainConfig.isActivatedEIP(2930) ? 1 : 0)

    const gasPrice = toBN(gas.price.levels.fast)

    txData.gasPrice = bnToHex(gasPrice)
  }

  return txData
}

function hexifySignature ({ v, r, s }: Signature) {
  return {
    v: addHexPrefix(v),
    r: addHexPrefix(r),
    s: addHexPrefix(s)
  }
}

async function sign (rawTx: TransactionData, signingFn: (tx: TypedTransaction) => Promise<Signature>) {
  const common = chainConfig(parseInt(rawTx.chainId), parseInt(rawTx.type) === 2 ? 'london' : 'berlin')

  // @ts-ignore
  const tx = TransactionFactory.fromTxData(rawTx, { common })

  return signingFn(tx).then(sig => {
    const signature = hexifySignature(sig)

    return TransactionFactory.fromTxData(
      {
      ...rawTx,
      ...signature
      },
      // @ts-ignore
      { common }
    )
  })
}

export {
  usesBaseFee,
  populate,
  sign,
  signerCompatibility,
  londonToLegacy
}
