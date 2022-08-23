import { BN, addHexPrefix, stripHexPrefix, bnToHex, intToHex } from 'ethereumjs-util'
import { TransactionFactory, TypedTransaction } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'

import chainConfig from '../chains/config'
import { AppVersion, SignerSummary } from '../signers/Signer'
import { GasFeesSource, TransactionData, typeSupportsBaseFee } from '../../resources/domain/transaction'

const londonHardforkSigners: SignerCompatibilityByVersion = {
  seed: () => true,
  ring: () => true,
  ledger: version => version.major >= 2 || (version.major >= 1 && version.minor >= 9),
  trezor: (version, model) => {
    if ((model || '').toLowerCase() === 'trezor one') {
      return version.major >= 2 ||
        (
          version.major >= 1 &&
            (
              version.minor > 10 ||
              (version.minor === 10 && version.patch >= 4)
            )
        )
    }

    // 3.x+, 2.5.x+, or 2.4.2+
    return version.major >= 3 || (version.major === 2 && version.minor >= 5) || (version.major === 2 && version.minor === 4 && version.patch >= 2)
  },
  lattice: version =>  version.major >= 1 || version.minor >= 11
}

type SignerCompatibilityByVersion = {
  [key: string]: (version: AppVersion, model?: string) => boolean
}

export interface Signature {
  v: string,
  r: string,
  s: string
}

export interface SignerCompatibility  {
  signer: string,
  tx: string,
  compatible: boolean
}

function toBN (hexStr: string) {
  return new BN(stripHexPrefix(hexStr), 'hex')
}

function signerCompatibility (txData: TransactionData, signer: SignerSummary): SignerCompatibility {
  if (typeSupportsBaseFee(txData.type)) {
    const compatible = (signer.type in londonHardforkSigners) && londonHardforkSigners[signer.type](signer.appVersion, signer.model)
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

function maxFee (rawTx: TransactionData) {
  const chainId = parseInt(rawTx.chainId)

  // for ETH-based chains, the max fee should be 2 ETH
  if ([1, 3, 4, 5, 6, 10, 42, 61, 62, 63, 69, 42161, 421611].includes(chainId)) {
    return 2 * 1e18
  }

  // for Fantom, the max fee should be 250 FTM
  if ([250, 4002].includes(chainId)) {
    return 250 * 1e18
  }

  // for all other chains, default to 50 of the chain's currency
  return 50 * 1e18
}

function populate (rawTx: TransactionData, chainConfig: Common, gas: any): TransactionData {
  const txData: TransactionData = { ...rawTx }

  if (chainConfig.isActivatedEIP(1559) && gas.price.fees) {
    txData.type = intToHex(2)

    const maxPriorityFee = toBN(gas.price.fees.maxPriorityFeePerGas)
    const maxBaseFee = toBN(gas.price.fees.maxBaseFeePerGas)

    const useDappMaxFeePerGas = rawTx.maxFeePerGas && !isNaN(parseInt(rawTx.maxFeePerGas, 16))
    if (useDappMaxFeePerGas) {
      txData.gasFeesSource = GasFeesSource.Dapp
    } else {
      const maxFee = maxPriorityFee.add(maxBaseFee)
      txData.maxFeePerGas = bnToHex(maxFee)
    }
    
    const useDappMaxPriorityFeePerGas = rawTx.maxPriorityFeePerGas && !isNaN(parseInt(rawTx.maxPriorityFeePerGas, 16))
    if (useDappMaxPriorityFeePerGas) {
      txData.gasFeesSource = GasFeesSource.Dapp
    } else {
      txData.maxPriorityFeePerGas = bnToHex(maxPriorityFee)
    }
  } else {
    txData.type = intToHex(chainConfig.isActivatedEIP(2930) ? 1 : 0)

    const useDappGasPrice = rawTx.gasPrice && !isNaN(parseInt(rawTx.gasPrice, 16))
    if (useDappGasPrice) {
      txData.gasFeesSource = GasFeesSource.Dapp
    } else {
      const gasPrice = toBN(gas.price.levels.fast)
      txData.gasPrice = bnToHex(gasPrice)
    }
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

  const tx = TransactionFactory.fromTxData(rawTx, { common })

  return signingFn(tx).then(sig => {
    const signature = hexifySignature(sig)

    return TransactionFactory.fromTxData(
      {
      ...rawTx,
      ...signature
      },
      { common }
    )
  })
}

export {
  maxFee,
  populate,
  sign,
  signerCompatibility,
  londonToLegacy
}
