import { TransactionFactory } from '@ethereumjs/tx'
import { RLP } from '@ethereumjs/rlp'
import { addHexPrefix, stripHexPrefix } from '@ethereumjs/util'
import { createHash } from 'crypto'
import { keccak256 } from 'ethereum-cryptography/keccak'

import chainConfig from '../../chains/config'
import { TransactionData } from '../../../resources/domain/transaction'
import { QRLegacyEncoding, QRLegacyHashMode } from './types'

export type QRTxLegacyEncoding = QRLegacyEncoding
export type QRTxLegacyHashMode = QRLegacyHashMode
export type QRTxEncodingStrategy = 'primary' | QRTxLegacyEncoding

export const LEGACY_HASH_MODE_ORDER: QRTxLegacyHashMode[] = ['keccak', 'sha256', 'identity32']

export interface QRTxLegacyCandidate {
  encodingId: QRTxLegacyEncoding
  signData: string
  signDataBytes: Buffer
  hashHint: string
  keccakHint: string
}

export interface QRTxPayload {
  cleanTxData: TransactionData
  chainId: number
  txType: number
  isTypedTransaction: boolean
  signData: string
  signDataBytes: Buffer
  txEncodingStrategy: QRTxEncodingStrategy
  txHashHint: string
  txKeccakHint: string
  txHashMode: QRTxLegacyHashMode
  legacyCandidates?: QRTxLegacyCandidate[]
}

interface BuildQRTxPayloadOptions {
  preferredLegacyEncoding?: QRTxLegacyEncoding
  preferredLegacyHashMode?: QRTxLegacyHashMode
}

function sha256Hint(bytes: Uint8Array): string {
  return addHexPrefix(createHash('sha256').update(Buffer.from(bytes)).digest('hex'))
}

function keccakHint(bytes: Uint8Array): string {
  return addHexPrefix(Buffer.from(keccak256(Buffer.from(bytes))).toString('hex'))
}

function toHex(bytes: Uint8Array): string {
  return addHexPrefix(Buffer.from(bytes).toString('hex'))
}

function normalizeHex(value: string): string {
  const hex = stripHexPrefix(value)
  if (!hex) return '0'
  return hex.replace(/^0+/, '') || '0'
}

function hexToMinimalBuffer(value: string): Buffer {
  const normalized = normalizeHex(value)
  const evenLengthHex = normalized.length % 2 === 0 ? normalized : `0${normalized}`
  if (evenLengthHex === '00') return Buffer.alloc(0)
  return Buffer.from(evenLengthHex, 'hex')
}

function chooseLegacyCandidate(
  candidates: QRTxLegacyCandidate[],
  preferredLegacyEncoding?: QRTxLegacyEncoding
): QRTxLegacyCandidate {
  if (preferredLegacyEncoding) {
    const preferred = candidates.find((candidate) => candidate.encodingId === preferredLegacyEncoding)
    if (preferred) return preferred
  }

  return candidates[0]
}

function chooseLegacyHashMode(
  signDataBytes: Buffer,
  preferredLegacyHashMode?: QRTxLegacyHashMode
): QRTxLegacyHashMode {
  if (preferredLegacyHashMode === 'identity32' && signDataBytes.length !== 32) {
    return 'keccak'
  }

  return preferredLegacyHashMode || 'keccak'
}

export function computeLegacyRecoveryHash(signDataBytes: Buffer, hashMode: QRTxLegacyHashMode): Buffer {
  if (hashMode === 'identity32') {
    if (signDataBytes.length !== 32) {
      throw new Error(`identity32 hash mode requires 32-byte payload (got ${signDataBytes.length})`)
    }

    return Buffer.from(signDataBytes)
  }

  if (hashMode === 'sha256') {
    return Buffer.from(createHash('sha256').update(signDataBytes).digest())
  }

  return Buffer.from(keccak256(signDataBytes))
}

export function buildQRTxPayload(rawTx: TransactionData, options: BuildQRTxPayloadOptions = {}): QRTxPayload {
  const chainId = parseInt(rawTx.chainId, 16)
  const txType = parseInt(rawTx.type || '0x0', 16)
  const isTypedTransaction = txType >= 1

  const cleanTxData = {
    chainId: rawTx.chainId,
    type: rawTx.type,
    gasFeesSource: rawTx.gasFeesSource,
    nonce: rawTx.nonce,
    to: rawTx.to,
    value: rawTx.value,
    data: rawTx.data,
    gasLimit: rawTx.gasLimit || rawTx.gas
  } as TransactionData

  if (txType === 2) {
    cleanTxData.maxFeePerGas = rawTx.maxFeePerGas
    cleanTxData.maxPriorityFeePerGas = rawTx.maxPriorityFeePerGas
  } else {
    cleanTxData.gasPrice = rawTx.gasPrice
  }

  if (rawTx.accessList) {
    cleanTxData.accessList = rawTx.accessList
  }

  const common = chainConfig(chainId, txType === 2 ? 'london' : 'berlin')
  const tx = TransactionFactory.fromTxData(cleanTxData, { common })
  const messageToSign = tx.getMessageToSign(false)
  const primaryBytes = Buffer.from(Array.isArray(messageToSign) ? RLP.encode(messageToSign) : messageToSign)

  if (txType !== 0) {
    return {
      cleanTxData,
      chainId,
      txType,
      isTypedTransaction,
      signData: toHex(primaryBytes),
      signDataBytes: primaryBytes,
      txEncodingStrategy: 'primary',
      txHashHint: sha256Hint(primaryBytes),
      txKeccakHint: keccakHint(primaryBytes),
      txHashMode: 'keccak'
    }
  }

  const legacyUnsignedBytes = Buffer.from(RLP.encode((tx.raw() as Buffer[]).slice(0, 6)))
  const legacyCandidates: QRTxLegacyCandidate[] = [
    {
      encodingId: 'legacy-eip155-unsigned',
      signData: toHex(primaryBytes),
      signDataBytes: primaryBytes,
      hashHint: sha256Hint(primaryBytes),
      keccakHint: keccakHint(primaryBytes)
    },
    {
      encodingId: 'legacy-unsigned',
      signData: toHex(legacyUnsignedBytes),
      signDataBytes: legacyUnsignedBytes,
      hashHint: sha256Hint(legacyUnsignedBytes),
      keccakHint: keccakHint(legacyUnsignedBytes)
    }
  ]

  const selectedLegacyCandidate = chooseLegacyCandidate(legacyCandidates, options.preferredLegacyEncoding)
  const selectedHashMode = chooseLegacyHashMode(
    selectedLegacyCandidate.signDataBytes,
    options.preferredLegacyHashMode
  )

  return {
    cleanTxData,
    chainId,
    txType,
    isTypedTransaction,
    signData: selectedLegacyCandidate.signData,
    signDataBytes: selectedLegacyCandidate.signDataBytes,
    txEncodingStrategy: selectedLegacyCandidate.encodingId,
    txHashHint: selectedLegacyCandidate.hashHint,
    txKeccakHint: selectedLegacyCandidate.keccakHint,
    txHashMode: selectedHashMode,
    legacyCandidates
  }
}

export function serializeSignedLegacyTransaction(
  cleanTxData: TransactionData,
  signature: { v: string; r: string; s: string }
): string {
  const chainId = parseInt(cleanTxData.chainId, 16)
  const tx = TransactionFactory.fromTxData(cleanTxData, {
    common: chainConfig(chainId, 'berlin')
  })

  const unsignedRaw = (tx.raw() as Buffer[]).slice(0, 6)
  const serialized = Buffer.from(
    RLP.encode([
      ...unsignedRaw,
      hexToMinimalBuffer(signature.v),
      hexToMinimalBuffer(signature.r),
      hexToMinimalBuffer(signature.s)
    ])
  )

  return addHexPrefix(serialized.toString('hex'))
}
