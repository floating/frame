import { addHexPrefix } from '@ethereumjs/util'
import { TransactionFactory, TypedTransaction } from '@ethereumjs/tx'

import { AppVersion, SignerSummary } from '../signers/Signer'
import { TransactionData, typeSupportsBaseFee } from '../../resources/domain/transaction'
import { isNonZeroHex } from '../../resources/utils'
import chainConfig from '../chains/config'
import { TransactionRequest, TxClassification } from '../accounts/types'

const londonHardforkSigners: SignerCompatibilityByVersion = {
  seed: () => true,
  ring: () => true,
  ledger: (version) => version.major >= 2 || (version.major >= 1 && version.minor >= 9),
  trezor: (version, model) => {
    if ((model || '').toLowerCase() === 'trezor one') {
      return (
        version.major >= 2 ||
        (version.major >= 1 && (version.minor > 10 || (version.minor === 10 && version.patch >= 4)))
      )
    }

    // 3.x+, 2.5.x+, or 2.4.2+
    return (
      version.major >= 3 ||
      (version.major === 2 && version.minor >= 5) ||
      (version.major === 2 && version.minor === 4 && version.patch >= 2)
    )
  },
  lattice: (version) => version.major >= 1 || version.minor >= 11
}

type SignerCompatibilityByVersion = {
  [key: string]: (version: AppVersion, model?: string) => boolean
}

export interface Signature {
  v: string
  r: string
  s: string
}

export interface SignerCompatibility {
  signer: string
  tx: string
  compatible: boolean
}

function signerCompatibility(txData: TransactionData, signer: SignerSummary): SignerCompatibility {
  if (typeSupportsBaseFee(txData.type)) {
    const compatible =
      signer.type in londonHardforkSigners &&
      londonHardforkSigners[signer.type](signer.appVersion, signer.model)
    return { signer: signer.type, tx: 'london', compatible }
  }

  return {
    signer: signer.type,
    tx: 'legacy',
    compatible: true
  }
}

function londonToLegacy(txData: TransactionData): TransactionData {
  if (txData.type === '0x2') {
    const { type, maxFeePerGas, maxPriorityFeePerGas, ...tx } = txData

    return { ...tx, type: '0x0', gasPrice: maxFeePerGas }
  }

  return txData
}

function hexifySignature({ v, r, s }: Signature) {
  return {
    v: addHexPrefix(v),
    r: addHexPrefix(r),
    s: addHexPrefix(s)
  }
}

async function sign(rawTx: TransactionData, signingFn: (tx: TypedTransaction) => Promise<Signature>) {
  const common = chainConfig(
    parseInt(rawTx.chainId, 16),
    parseInt(rawTx.type, 16) === 2 ? 'london' : 'berlin'
  )

  const tx = TransactionFactory.fromTxData(rawTx, { common })

  return signingFn(tx).then((sig) => {
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

function classifyTransaction({
  payload: { params },
  recipientType
}: Omit<TransactionRequest, 'classification'>): TxClassification {
  const { to, data = '0x' } = params[0]

  if (!to) return TxClassification.CONTRACT_DEPLOY
  if (recipientType === 'external' && data.length > 2) return TxClassification.SEND_DATA
  if (isNonZeroHex(data) && recipientType !== 'external') return TxClassification.CONTRACT_CALL
  return TxClassification.NATIVE_TRANSFER
}

export { sign, signerCompatibility, londonToLegacy, classifyTransaction }
