import { BN, addHexPrefix, stripHexPrefix, bnToHex } from 'ethereumjs-util'
import { Transaction, TransactionFactory, TxData } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'

import { chainConfig } from '../../main/chains/config'

interface Signature {
  v: string,
  r: string,
  s: string
}

export interface RawTransaction { 
  chainId: string,
  type: string
}

export interface TransactionData {
  chainId: string,
}

function toBN(hexStr: string) {
  return new BN(stripHexPrefix(hexStr), 'hex')
}

async function populate (rawTx: any, chainConfig: Common, gasCalculator) {
  const txData =  { ...rawTx }

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

    const maxPriorityFee = toBN(gasCalculator.getMaxPriorityFeePerGas(txData))
    const maxBaseFee = toBN(gasCalculator.getMaxBaseFeePerGas(txData))
    const maxFee = maxPriorityFee.add(maxBaseFee)

    txData.maxPriorityFeePerGas = bnToHex(maxPriorityFee)
    txData.maxFeePerGas = bnToHex(maxFee)
    txData.maxFee = txData.maxFeePerGas
  } else {
    console.log('london hardfork NOT active!')
    txData.type = '0x0'

    const gasPrice = toBN(gasCalculator.getGasPrice(txData))

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
  const tx = TransactionFactory.fromTxData(rawTx, { common })

  return signingFn(tx).then(sig => {
    const signature = hexifySignature(sig)
    
    return Transaction.fromTxData({
      ...rawTx,
      ...signature
    }, { common })
  })
}

export {
  populate,
  sign
}
