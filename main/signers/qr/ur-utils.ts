import { URDecoder, UREncoder } from '@ngraveio/bc-ur'
import {
  CryptoHDKey,
  CryptoAccount,
  ETHSignature,
  EthSignRequest,
  DataType
} from '@keystonehq/bc-ur-registry-eth'
import { addHexPrefix, stripHexPrefix } from '@ethereumjs/util'
import { TransactionData } from '../../../resources/domain/transaction'
import { QRDeviceData } from './types'

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

  const xpub = cryptoHDKey.getBip32Key()
  const origin = cryptoHDKey.getOrigin()
  const masterFingerprint = origin?.getSourceFingerprint()?.toString('hex') || ''
  const path = origin?.getPath() || "m/44'/60'/0'"

  return {
    masterFingerprint,
    xpub,
    derivationPath: path,
    name: 'QR Wallet'
  }
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
      const path = origin?.getPath() || "m/44'/60'/0'"

      return {
        masterFingerprint,
        xpub,
        derivationPath: path,
        name: 'QR Wallet'
      }
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
  const encoder = new UREncoder(ur, 200) // 200 bytes per fragment

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
export function parseSignatureUR(urData: string): { signature: string; requestId: string } {
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
  const requestId = ethSignature.getRequestId()?.toString('hex') || ''

  // Combine r, s, v into a single signature string
  const r = signature.slice(0, 32)
  const s = signature.slice(32, 64)
  const v = signature[64]

  const signatureHex = addHexPrefix(r.toString('hex') + s.toString('hex') + v.toString(16).padStart(2, '0'))

  return {
    signature: signatureHex,
    requestId
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
