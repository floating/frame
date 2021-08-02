import { BN, addHexPrefix, stripHexPrefix, bnToHex } from 'ethereumjs-util'
import { JsonTx, Transaction, TransactionFactory, TxData } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'

import chainConfig from '../chains/config'

const londonHardforkSigners = ['seed', 'ring']

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

export interface SignerCompatibility  {
  signer: string,
  tx: string,
  compatible: boolean
}

function toBN (hexStr: string) {
  return new BN(stripHexPrefix(hexStr), 'hex')
}

function signerCompatibility (txData: TransactionData, signer: string): SignerCompatibility {
  return txData.type === '0x2' ? ({
    signer, tx: 'london', compatible: londonHardforkSigners.includes(signer)
  }) : ({ 
    signer, tx: 'legacy', compatible: true 
  })
}

function londonToLegacy (txData: TransactionData): TransactionData {
  if (txData.type === '0x2') {
    txData.type = '0x0'
    txData.gasPrice = txData.maxFeePerGas
    delete txData.maxPriorityFeePerGas
    delete txData.maxFeePerGas
  }
  return txData
}

async function populate (rawTx: RawTransaction, chainConfig: Common, gas: any): Promise<TransactionData> {
  const txData: TransactionData = { ...rawTx, maxFee: '' }
  
  if (chainConfig.isActivatedEIP(1559)) {
    txData.type = '0x2'

    const maxPriorityFee = toBN(gas.price.fees.maxPriorityFeePerGas)
    const maxBaseFee = toBN(gas.price.fees.maxBaseFeePerGas)
    const bufferForUX = maxBaseFee.divRound(new BN(20)) // Buffer for fee updater UX
    const maxFee = maxPriorityFee.add(maxBaseFee).add(bufferForUX)

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
  sign,
  signerCompatibility,
  londonToLegacy
}
