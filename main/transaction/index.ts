import { BN, addHexPrefix, stripHexPrefix, bnToHex } from 'ethereumjs-util'
import { JsonTx, Transaction, TransactionFactory, TxData } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'

import { chainConfig } from '../../main/chains/config'
import GasCalculator from './gasCalculator'

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

function toBN(hexStr: string) {
  return new BN(stripHexPrefix(hexStr), 'hex')
}

async function populate (rawTx: RawTransaction, chainConfig: Common, gasCalculator: GasCalculator): Promise<TransactionData> {
  const txData: TransactionData = { ...rawTx, maxFee: '' }

  // calculate needed gas if not already provided
  try {
    txData.gasLimit = txData.gasLimit || (await gasCalculator.getGasEstimate(rawTx))
  } catch (e) {
    txData.gasLimit = '0x0'
    txData.warning = e.message
  }

  if (chainConfig.isActivatedEIP(1559)) {
    console.log('london hardfork active!')
    txData.type = '0x2'

    const maxPriorityFee = toBN(gasCalculator.getMaxPriorityFeePerGas(rawTx))
    const maxBaseFee = toBN(gasCalculator.getMaxBaseFeePerGas(rawTx))
    const maxFee = maxPriorityFee.add(maxBaseFee)

    txData.maxPriorityFeePerGas = bnToHex(maxPriorityFee)
    txData.maxFeePerGas = bnToHex(maxFee)
    txData.maxFee = txData.maxFeePerGas
  } else {
    console.log('london hardfork NOT active!')
    txData.type = '0x0'

    const gasPrice = toBN(gasCalculator.getGasPrice(rawTx))

    txData.gasPrice = bnToHex(gasPrice)
    txData.maxFee = bnToHex(toBN(txData.gasLimit).mul(gasPrice))
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

async function sign(rawTx: RawTransaction, signingFn: (tx: TxData) => Promise<Signature>) {
  const common = chainConfig(rawTx.chainId, parseInt(rawTx.type) === 2 ? 'london' : 'berlin')

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
