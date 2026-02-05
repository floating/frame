import { URDecoder, UREncoder } from '@ngraveio/bc-ur'
import {
  CryptoHDKey,
  CryptoAccount,
  ETHSignature,
  EthSignRequest,
  DataType
} from '@keystonehq/bc-ur-registry-eth'
import { addHexPrefix, stripHexPrefix } from '@ethereumjs/util'
import { v5 as uuid, stringify as stringifyUuid } from 'uuid'
import { TransactionData } from '../../../resources/domain/transaction'
import { QRDeviceData, QRLegacyEncoding, QRLegacyHashMode } from './types'

const DEFAULT_QR_DERIVATION_PATH = "m/44'/60'/0'"
const qrProfileNamespace = '3f1c23c7-c6cf-59c2-86c2-d6a7da4ad993'

function normalizeDerivationPath(path?: string): string {
  const trimmed = (path || '').trim()
  const withoutM = trimmed.startsWith('m/') ? trimmed.slice(2) : trimmed
  const normalized = withoutM.replace(/^\/+/, '').replace(/\/+$/, '')

  if (!normalized) {
    return DEFAULT_QR_DERIVATION_PATH
  }

  return `m/${normalized}`
}

function normalizeOptionalPath(path?: string): string | undefined {
  const trimmed = (path || '').trim()
  return trimmed ? trimmed.replace(/^\/+/, '').replace(/\/+$/, '') : undefined
}

function normalizeAccountSource(source?: string): string | undefined {
  const trimmed = (source || '').trim()
  return trimmed || undefined
}

function normalizePreferredLegacyEncoding(value?: string): QRLegacyEncoding | undefined {
  if (value === 'legacy-eip155-unsigned' || value === 'legacy-unsigned') {
    return value
  }

  return undefined
}

function normalizePreferredLegacyHashMode(value?: string): QRLegacyHashMode | undefined {
  if (value === 'keccak' || value === 'sha256' || value === 'identity32') {
    return value
  }

  return undefined
}

export function createQRProfileId(deviceData: {
  masterFingerprint: string
  xpub: string
  derivationPath: string
  accountSource?: string
  childrenPath?: string
}): string {
  const profileSeed = [
    (deviceData.masterFingerprint || '').toLowerCase(),
    deviceData.xpub || '',
    normalizeDerivationPath(deviceData.derivationPath),
    normalizeAccountSource(deviceData.accountSource) || '',
    normalizeOptionalPath(deviceData.childrenPath) || ''
  ].join('|')

  return uuid(profileSeed, qrProfileNamespace)
}

export function normalizeQRDeviceData(deviceData: Partial<QRDeviceData>): QRDeviceData {
  const masterFingerprint = (deviceData.masterFingerprint || '').toLowerCase()
  const xpub = deviceData.xpub || ''
  const derivationPath = normalizeDerivationPath(deviceData.derivationPath)
  const accountSource = normalizeAccountSource(deviceData.accountSource)
  const childrenPath = normalizeOptionalPath(deviceData.childrenPath)
  const preferredLegacyEncoding = normalizePreferredLegacyEncoding(deviceData.preferredLegacyEncoding)
  const preferredLegacyHashMode = normalizePreferredLegacyHashMode(deviceData.preferredLegacyHashMode)
  const profileId =
    deviceData.profileId ||
    createQRProfileId({
      masterFingerprint,
      xpub,
      derivationPath,
      accountSource,
      childrenPath
    })

  return {
    profileId,
    masterFingerprint,
    xpub,
    derivationPath,
    ...(accountSource ? { accountSource } : {}),
    ...(childrenPath ? { childrenPath } : {}),
    ...(preferredLegacyEncoding ? { preferredLegacyEncoding } : {}),
    ...(preferredLegacyHashMode ? { preferredLegacyHashMode } : {}),
    name: deviceData.name || 'QR Wallet'
  }
}

// Parse a crypto-account or crypto-hdkey UR to extract device data
export function parseAccountSyncUR(urData: string): QRDeviceData {
  const decoder = new URDecoder()

  // Handle animated QR by accumulating parts
  decoder.receivePart(urData)

  if (!decoder.isComplete()) {
    throw new Error('Incomplete UR data - need more QR frames')
  }

  const ur = decoder.resultUR()
  const type = ur.type

  if (type === 'crypto-hdkey') {
    return parseCryptoHDKey(ur)
  } else if (type === 'crypto-account') {
    return parseCryptoAccount(ur)
  } else {
    throw new Error(`Unsupported UR type: ${type}`)
  }
}

function parseCryptoHDKey(ur: any): QRDeviceData {
  const cryptoHDKey = CryptoHDKey.fromCBOR(ur.cbor)

  return normalizeQRDeviceData({
    masterFingerprint: cryptoHDKey.getOrigin()?.getSourceFingerprint()?.toString('hex') || '',
    xpub: cryptoHDKey.getBip32Key(),
    derivationPath: cryptoHDKey.getOrigin()?.getPath() || DEFAULT_QR_DERIVATION_PATH,
    accountSource: cryptoHDKey.getNote(),
    childrenPath: cryptoHDKey.getChildren()?.getPath(),
    name: 'QR Wallet'
  })
}

function parseCryptoAccount(ur: any): QRDeviceData {
  const cryptoAccount = CryptoAccount.fromCBOR(ur.cbor)

  const masterFingerprint = cryptoAccount.getMasterFingerprint().toString('hex')
  const outputDescriptors = cryptoAccount.getOutputDescriptors()

  // Find the first HD key descriptor for Ethereum
  for (const descriptor of outputDescriptors) {
    const hdKey = descriptor.getCryptoKey()
    if (hdKey instanceof CryptoHDKey) {
      const xpub = hdKey.getBip32Key()
      const origin = hdKey.getOrigin()
      return normalizeQRDeviceData({
        masterFingerprint,
        xpub,
        derivationPath: origin?.getPath() || DEFAULT_QR_DERIVATION_PATH,
        accountSource: hdKey.getNote(),
        childrenPath: hdKey.getChildren()?.getPath(),
        name: 'QR Wallet'
      })
    }
  }

  throw new Error('No HD key found in crypto-account')
}

// Create an animated QR decoder for handling multi-part URs
export function createURDecoder(): URDecoder {
  return new URDecoder()
}

// Check if a UR decoder has received all parts
export function isURComplete(decoder: URDecoder): boolean {
  return decoder.isComplete()
}

// Get the progress of a multi-part UR (0-1)
export function getURProgress(decoder: URDecoder): number {
  return decoder.getProgress()
}

// Encode an Ethereum sign request to UR format
export function encodeEthSignRequest(
  requestId: string,
  signData: string,
  dataType: 'transaction' | 'typedTransaction' | 'message' | 'typedData',
  chainId: number,
  derivationPath: string,
  address: string,
  masterFingerprint?: string
): { urData: string; animated: boolean; frames?: string[] } {
  let ethDataType: DataType

  switch (dataType) {
    case 'transaction':
      ethDataType = DataType.transaction
      break
    case 'typedTransaction':
      // EIP-1559 and EIP-2930 typed transactions use typedTransaction (value 4)
      ethDataType = DataType.typedTransaction
      break
    case 'message':
      ethDataType = DataType.personalMessage
      break
    case 'typedData':
      ethDataType = DataType.typedData
      break
    default:
      throw new Error(`Unsupported data type: ${dataType}`)
  }

  // Convert master fingerprint hex string to proper format for Keystone
  // The xfp should be passed as hex string (8 characters = 4 bytes)
  const xfp = masterFingerprint || ''

  const signRequest = EthSignRequest.constructETHRequest(
    Buffer.from(stripHexPrefix(signData), 'hex'),
    ethDataType,
    derivationPath,
    xfp,
    requestId,
    chainId,
    address
  )

  const ur = signRequest.toUR()
  const encoder = new UREncoder(ur, 400) // 400 bytes per fragment

  if (encoder.fragmentsLength === 1) {
    return {
      urData: encoder.nextPart().toUpperCase(),
      animated: false
    }
  }

  // Multiple fragments needed - generate all frames
  const frames: string[] = []
  while (frames.length < encoder.fragmentsLength) {
    frames.push(encoder.nextPart().toUpperCase())
  }

  return {
    urData: frames[0],
    animated: true,
    frames
  }
}

// Parse a signature UR response
export function parseSignatureUR(urData: string): {
  signature: string
  requestId: string
  requestIdHex: string
  requestIdUuid: string
} {
  const decoder = new URDecoder()
  decoder.receivePart(urData)

  if (!decoder.isComplete()) {
    throw new Error('Incomplete signature UR')
  }

  const ur = decoder.resultUR()

  if (ur.type !== 'eth-signature') {
    throw new Error(`Expected eth-signature, got ${ur.type}`)
  }

  const ethSignature = ETHSignature.fromCBOR(ur.cbor)
  const signature = ethSignature.getSignature()
  const requestIdBuffer = ethSignature.getRequestId()
  if (requestIdBuffer && requestIdBuffer.length !== 16) {
    throw new Error(`Invalid signature requestId length: ${requestIdBuffer.length}`)
  }
  const requestIdHex = requestIdBuffer ? requestIdBuffer.toString('hex') : ''
  const requestIdUuid =
    requestIdBuffer && requestIdBuffer.length === 16 ? stringifyUuid(requestIdBuffer).toLowerCase() : ''

  // Combine r, s, v into a single signature string
  const r = signature.slice(0, 32)
  const s = signature.slice(32, 64)
  const v = signature[64]

  const signatureHex = addHexPrefix(r.toString('hex') + s.toString('hex') + v.toString(16).padStart(2, '0'))

  return {
    signature: signatureHex,
    requestId: requestIdHex,
    requestIdHex,
    requestIdUuid
  }
}

// Serialize a transaction for signing
export function serializeTransactionForSigning(tx: TransactionData, chainId: number): string {
  // This will be used to create the unsigned transaction bytes
  // The exact serialization depends on the transaction type (legacy vs EIP-1559)

  const txData: any = {
    nonce: tx.nonce,
    gasLimit: tx.gasLimit,
    to: tx.to,
    value: tx.value,
    data: tx.data,
    chainId
  }

  if (tx.maxFeePerGas && tx.maxPriorityFeePerGas) {
    // EIP-1559 transaction
    txData.maxFeePerGas = tx.maxFeePerGas
    txData.maxPriorityFeePerGas = tx.maxPriorityFeePerGas
    txData.type = 2
  } else {
    // Legacy transaction
    txData.gasPrice = tx.gasPrice
  }

  // Return hex-encoded unsigned transaction
  // Note: In production, use @ethereumjs/tx to properly serialize
  return JSON.stringify(txData)
}
