import { BN, addHexPrefix, stripHexPrefix, bnToHex } from 'ethereumjs-util'
import { JsonTx, Transaction, TransactionFactory, TxData } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'

import { chainConfig } from '../chains/config'

interface Signature {
  v: string,
  r: string,
  s: string
}

export interface RawTransaction { 
  chainId: string,
  type: string
}

export interface TransactionData extends JsonTx {
  warning?: string,
  maxFee: string
}

function toBN (hexStr: string) {
  return new BN(stripHexPrefix(hexStr), 'hex')
}

async function populate (rawTx: RawTransaction, chainConfig: Common, gas: any): Promise<TransactionData> {
  const txData: TransactionData = { ...rawTx, maxFee: '' }

  if (chainConfig.isActivatedEIP(1559)) {
    txData.type = '0x2'

    const maxPriorityFee = toBN(gas.fees.maxPriorityFeePerGas)
    const maxBaseFee = toBN(gas.fees.maxBaseFeePerGas)
    const maxFee = maxPriorityFee.add(maxBaseFee)

    txData.maxPriorityFeePerGas = bnToHex(maxPriorityFee)
    txData.maxFeePerGas = bnToHex(maxFee)
    txData.maxFee = txData.maxFeePerGas
  } else {
    txData.type = '0x0'

    const gasPrice = toBN(gas.price.levels[gas.price.selected])

    txData.gasPrice = bnToHex(gasPrice)
    txData.maxFee = bnToHex(toBN(<string>txData.gasLimit).mul(gasPrice))
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

async function sign (rawTx: RawTransaction, signingFn: (tx: TxData) => Promise<Signature>) {
  const common = chainConfig(parseInt(rawTx.chainId), parseInt(rawTx.type) === 2 ? 'london' : 'berlin')

  // @ts-ignore
  const tx = TransactionFactory.fromTxData(rawTx, { common })

  return signingFn(tx).then(sig => {
    const signature = hexifySignature(sig)

    return Transaction.fromTxData(
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
  populate,
  sign
}
