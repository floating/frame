import log from 'electron-log'
import { v5 as uuid } from 'uuid'
import { hdkey } from 'ethereumjs-wallet'
import { addHexPrefix, ecrecover, pubToAddress, stripHexPrefix, toChecksumAddress } from '@ethereumjs/util'

import Signer from '../../Signer'
import { Status, QRDeviceData } from '../types'
import { normalizeQRDeviceData } from '../ur-utils'
import { TransactionData } from '../../../../resources/domain/transaction'
import type { TypedMessage } from '../../../accounts/types'
import { sign } from '../../../transaction'
import { buildDerivationCandidates, type QRDerivationStrategy } from '../derivation'
import { QRSignError, isRecoverableQRSignError } from '../errors'
import {
  buildQRTxPayload,
  computeLegacyRecoveryHash,
  LEGACY_HASH_MODE_ORDER,
  QRTxEncodingStrategy,
  QRTxLegacyHashMode,
  QRTxLegacyEncoding,
  serializeSignedLegacyTransaction
} from '../transaction-utils'

const ns = '7e14f1e3-b8b2-5a12-9a1c-3e5f8c9d0a2b'

const DEFAULT_ADDRESS_LIMIT = 10
const HARDENED_OFFSET = 0x80000000

export interface ResolvedQRDerivation {
  index: number
  strategy: QRDerivationStrategy
  fullPath: string
  relativePath: string
  address: string
  matchesExpectedAddress: boolean
}

interface SignatureValidationAttempt {
  encodingId: 'typed-primary' | QRTxLegacyEncoding
  hashMode: QRTxLegacyHashMode
  vMode: 'typed-0-1' | 'legacy-eip155-v' | 'legacy-27-28-v'
  v: string
  txHashHint?: string
  txKeccakHint?: string
  recoveredAddress?: string
  error?: string
}

interface SubmitSignatureOptions {
  txEncodingStrategy?: QRTxEncodingStrategy
  txHashMode?: QRTxLegacyHashMode
}

interface SubmitSignatureResult {
  selectedLegacyEncoding?: QRTxLegacyEncoding
  selectedHashMode?: QRTxLegacyHashMode
}

export default class QRSigner extends Signer {
  // Device metadata
  profileId: string
  masterFingerprint: string
  xpub: string
  derivationPath: string
  accountSource?: string
  childrenPath?: string
  preferredLegacyEncoding?: QRTxLegacyEncoding
  preferredLegacyHashMode?: QRTxLegacyHashMode

  // Address derivation
  private hdNode: any
  private resolvedDerivations: { [index: number]: ResolvedQRDerivation } = {}
  addressLimit: number = DEFAULT_ADDRESS_LIMIT

  // Pending sign request (set when waiting for user to scan QR)
  private pendingSignRequest: {
    type: 'transaction' | 'message' | 'typedData'
    index: number
    data: any
    callback: Callback<string>
    // Store computed payload at QR creation time to prevent mutation issues
    txPayloadSnapshot?: ReturnType<typeof buildQRTxPayload>
  } | null = null

  constructor(deviceData: QRDeviceData) {
    super()

    const normalizedDeviceData = normalizeQRDeviceData(deviceData)

    this.profileId = normalizedDeviceData.profileId
    this.masterFingerprint = normalizedDeviceData.masterFingerprint
    this.xpub = normalizedDeviceData.xpub
    this.derivationPath = normalizedDeviceData.derivationPath
    this.accountSource = normalizedDeviceData.accountSource
    this.childrenPath = normalizedDeviceData.childrenPath
    this.preferredLegacyEncoding = normalizedDeviceData.preferredLegacyEncoding
    this.preferredLegacyHashMode = normalizedDeviceData.preferredLegacyHashMode
    this.name = normalizedDeviceData.name

    // Generate unique ID based on profile (fingerprint + xpub/path/source)
    this.id = uuid('QR' + this.profileId, ns)
    this.type = 'qr'
    this.model = 'QR Hardware Wallet'
    this.status = Status.INITIAL
  }

  async open() {
    try {
      // Initialize HD node from xpub
      this.hdNode = hdkey.fromExtendedKey(this.xpub)

      // Derive addresses
      await this.deriveAddresses()

      this.status = Status.OK
      this.emit('update')
    } catch (err) {
      log.error('Failed to open QR signer:', err)
      this.status = Status.ERROR
      this.emit('error', err)
    }
  }

  close() {
    this.emit('close')
    this.removeAllListeners()
    super.close()
  }

  delete() {
    // Clean up any stored data
    this.hdNode = null
    this.addresses = []
    this.resolvedDerivations = {}
    this.pendingSignRequest = null
  }

  private async deriveAddresses() {
    if (!this.hdNode) {
      throw new Error('HD node not initialized')
    }

    this.status = Status.DERIVING
    this.emit('update')

    const derivedAddresses: string[] = []
    const resolvedDerivations: { [index: number]: ResolvedQRDerivation } = {}

    for (let i = 0; i < this.addressLimit; i++) {
      try {
        const resolved = this.resolveDerivation(i)
        derivedAddresses.push(resolved.address)
        resolvedDerivations[i] = resolved
        log.verbose(
          `Derived QR address #${i}: ${resolved.address} (path=${resolved.fullPath}, strategy=${resolved.strategy})`
        )
      } catch (err) {
        log.error(`Failed to derive address at index ${i}:`, err)
        break
      }
    }

    this.addresses = derivedAddresses
    this.resolvedDerivations = resolvedDerivations
    this.status = Status.OK
    this.emit('update')
  }

  private parseDerivationComponent(component: string): number {
    const trimmed = component.trim()
    if (!trimmed) {
      throw new Error('Empty derivation path component')
    }

    const hardened = trimmed.endsWith("'")
    const rawValue = hardened ? trimmed.slice(0, -1) : trimmed
    const value = parseInt(rawValue, 10)

    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`Invalid derivation path component: ${component}`)
    }

    return hardened ? value + HARDENED_OFFSET : value
  }

  private deriveAddressByRelativePath(relativePath: string): string {
    if (!this.hdNode) {
      throw new Error('HD node not initialized')
    }

    const components = relativePath.split('/').filter(Boolean)
    const derivedNode = components.reduce((node, component) => {
      const index = this.parseDerivationComponent(component)
      return node.deriveChild(index)
    }, this.hdNode)

    const publicKey = derivedNode.getWallet().getPublicKey()
    return toChecksumAddress(addHexPrefix(pubToAddress(publicKey).toString('hex')))
  }

  resolveDerivation(index: number, expectedAddress?: string): ResolvedQRDerivation {
    const cached = this.resolvedDerivations[index]
    if (cached) {
      const matchesExpectedAddress = expectedAddress
        ? cached.address.toLowerCase() === expectedAddress.toLowerCase()
        : true

      if (!expectedAddress || matchesExpectedAddress) {
        return { ...cached, matchesExpectedAddress }
      }
    }

    const normalizedExpectedAddress = expectedAddress?.toLowerCase()
    const candidates = buildDerivationCandidates(this.derivationPath, this.childrenPath, index)
    const resolvedCandidates = candidates
      .map((candidate) => {
        try {
          const address = this.deriveAddressByRelativePath(candidate.relativePath)
          return {
            index,
            strategy: candidate.strategy,
            fullPath: candidate.fullPath,
            relativePath: candidate.relativePath,
            address,
            matchesExpectedAddress: normalizedExpectedAddress
              ? address.toLowerCase() === normalizedExpectedAddress
              : true
          }
        } catch (error) {
          log.verbose(
            `Failed QR derivation candidate (index=${index}, path=${candidate.fullPath}, strategy=${candidate.strategy}):`,
            error
          )
          return null
        }
      })
      .filter(Boolean) as ResolvedQRDerivation[]

    if (resolvedCandidates.length === 0) {
      throw new Error(`Could not derive any address for QR index ${index}`)
    }

    if (normalizedExpectedAddress) {
      const matchedCandidate = resolvedCandidates.find((candidate) => candidate.matchesExpectedAddress)
      if (matchedCandidate) {
        this.resolvedDerivations[index] = matchedCandidate
        return matchedCandidate
      }

      return {
        ...resolvedCandidates[0],
        matchesExpectedAddress: false
      }
    }

    this.resolvedDerivations[index] = resolvedCandidates[0]
    return resolvedCandidates[0]
  }

  private orderLegacyCandidates(
    encodingCandidates: NonNullable<ReturnType<typeof buildQRTxPayload>['legacyCandidates']>,
    preferredEncoding?: QRTxLegacyEncoding
  ) {
    if (!preferredEncoding) return encodingCandidates

    return [...encodingCandidates].sort((left, right) => {
      if (left.encodingId === preferredEncoding && right.encodingId !== preferredEncoding) return -1
      if (right.encodingId === preferredEncoding && left.encodingId !== preferredEncoding) return 1
      return 0
    })
  }

  private orderHashModes(preferredHashMode?: QRTxLegacyHashMode): QRTxLegacyHashMode[] {
    if (!preferredHashMode) return LEGACY_HASH_MODE_ORDER

    const ordered = [preferredHashMode]
    LEGACY_HASH_MODE_ORDER.forEach((mode) => {
      if (!ordered.includes(mode)) ordered.push(mode)
    })

    return ordered
  }

  private recoverLegacySignatureAddress(
    txHash: Buffer,
    r: Buffer,
    s: Buffer,
    recoveryId: number,
    chainId: number,
    vMode: 'legacy-eip155-v' | 'legacy-27-28-v'
  ): { vHex: string; recoveredAddress: string } {
    const vValue =
      vMode === 'legacy-eip155-v'
        ? BigInt(chainId) * BigInt(2) + BigInt(35) + BigInt(recoveryId)
        : BigInt(27 + recoveryId)

    const recoveredPublicKey =
      vMode === 'legacy-eip155-v'
        ? ecrecover(txHash, vValue, r, s, BigInt(chainId))
        : ecrecover(txHash, vValue, r, s)

    return {
      vHex: vValue.toString(16),
      recoveredAddress: addHexPrefix(pubToAddress(recoveredPublicKey).toString('hex')).toLowerCase()
    }
  }

  private startTransactionSignRequest(index: number, rawTx: TransactionData, cb: Callback<string>) {
    const address = this.addresses[index]
    if (!address) {
      return cb(new Error(`No address at index ${index}`), undefined)
    }

    // Compute and store payload snapshot at QR creation time.
    // This prevents verification failures when transaction data (gasPrice, nonce)
    // is mutated after the QR is shown but before the signature is submitted.
    const txPayloadSnapshot = buildQRTxPayload(rawTx, {
      preferredLegacyEncoding: this.preferredLegacyEncoding,
      preferredLegacyHashMode: this.preferredLegacyHashMode
    })

    this.pendingSignRequest = {
      type: 'transaction',
      index,
      data: { rawTx, address },
      callback: cb,
      txPayloadSnapshot
    }

    this.status = Status.AWAITING_SIGNATURE
    this.emit('update')
    this.emit('sign-request', {
      type: 'transaction',
      index,
      address,
      transaction: rawTx,
      // Include pre-built payload - ensures byte consistency with verification
      txPayload: {
        signData: txPayloadSnapshot.signData,
        isTypedTransaction: txPayloadSnapshot.isTypedTransaction,
        chainId: txPayloadSnapshot.chainId,
        txType: txPayloadSnapshot.txType,
        txEncodingStrategy: txPayloadSnapshot.txEncodingStrategy,
        txHashMode: txPayloadSnapshot.txHashMode,
        txHashHint: txPayloadSnapshot.txHashHint,
        txKeccakHint: txPayloadSnapshot.txKeccakHint
      }
    })
  }

  verifyAddress(index: number, currentAddress: string, display: boolean, cb: Callback<boolean>) {
    // For QR signers, we can only verify by matching the derived address
    // The actual verification would need to be done on the device
    const address = this.addresses[index]

    if (!address) {
      return cb(new Error(`No address at index ${index}`), undefined)
    }

    const matches = address.toLowerCase() === currentAddress.toLowerCase()

    if (!matches) {
      return cb(new Error('Address does not match derived address'), undefined)
    }

    // For display verification, emit an event that the UI can handle
    // to show a QR code for the user to verify on their device
    if (display) {
      this.emit('verify-address', { index, address })
    }

    cb(null, true)
  }

  signMessage(index: number, message: string, cb: Callback<string>) {
    if (this.pendingSignRequest) {
      return cb(new Error('Another signing request is pending'), undefined)
    }

    const address = this.addresses[index]
    if (!address) {
      return cb(new Error(`No address at index ${index}`), undefined)
    }

    // Store the pending request and emit event for UI to display QR
    this.pendingSignRequest = {
      type: 'message',
      index,
      data: { message, address },
      callback: cb
    }

    this.status = Status.AWAITING_SIGNATURE
    this.emit('update')
    this.emit('sign-request', {
      type: 'message',
      index,
      address,
      message
    })
  }

  signTransaction(index: number, rawTx: TransactionData, cb: Callback<string>) {
    if (this.pendingSignRequest) {
      return cb(new Error('Another signing request is pending'), undefined)
    }

    this.startTransactionSignRequest(index, rawTx, cb)
  }

  signTypedData(index: number, typedMessage: TypedMessage, cb: Callback<string>) {
    if (this.pendingSignRequest) {
      return cb(new Error('Another signing request is pending'), undefined)
    }

    const address = this.addresses[index]
    if (!address) {
      return cb(new Error(`No address at index ${index}`), undefined)
    }

    // Store the pending request and emit event for UI to display QR
    this.pendingSignRequest = {
      type: 'typedData',
      index,
      data: { typedMessage, address },
      callback: cb
    }

    this.status = Status.AWAITING_SIGNATURE
    this.emit('update')
    this.emit('sign-request', {
      type: 'typedData',
      index,
      address,
      typedData: typedMessage
    })
  }

  // Called by UI when user has scanned the signature QR from their device
  async submitSignature(
    signature: string,
    options: SubmitSignatureOptions = {}
  ): Promise<SubmitSignatureResult> {
    if (!this.pendingSignRequest) {
      throw new QRSignError('No pending QR sign request', 'QR_NO_PENDING_REQUEST')
    }

    const { type, data } = this.pendingSignRequest
    const callback = this.pendingSignRequest.callback

    log.info('QR signer received signature')

    try {
      if (type === 'transaction') {
        const rawTx = data.rawTx as TransactionData
        const expectedAddress = (rawTx.from || data.address) as string
        const expectedAddressLower = expectedAddress.toLowerCase()
        const sigHex = stripHexPrefix(signature)

        if (sigHex.length !== 130 || !/^[0-9a-fA-F]+$/.test(sigHex)) {
          throw new QRSignError(
            'Invalid signature format: expected 65-byte hex payload',
            'QR_SIGNATURE_INVALID_FORMAT'
          )
        }

        const r = sigHex.slice(0, 64)
        const s = sigHex.slice(64, 128)
        const rBuffer = Buffer.from(r, 'hex')
        const sBuffer = Buffer.from(s, 'hex')
        const vRaw = parseInt(sigHex.slice(128, 130), 16)

        if (Number.isNaN(vRaw)) {
          throw new QRSignError('Invalid signature recovery byte', 'QR_SIGNATURE_INVALID_RECOVERY')
        }

        const recoveryId = vRaw >= 27 ? vRaw - 27 : vRaw
        if (recoveryId !== 0 && recoveryId !== 1) {
          throw new QRSignError(`Invalid signature recovery value: ${vRaw}`, 'QR_SIGNATURE_INVALID_RECOVERY')
        }

        const requestedLegacyEncoding =
          options.txEncodingStrategy === 'legacy-eip155-unsigned' ||
          options.txEncodingStrategy === 'legacy-unsigned'
            ? options.txEncodingStrategy
            : this.preferredLegacyEncoding
        const requestedLegacyHashMode =
          options.txHashMode === 'keccak' ||
          options.txHashMode === 'sha256' ||
          options.txHashMode === 'identity32'
            ? options.txHashMode
            : this.preferredLegacyHashMode

        // Use the payload snapshot captured at QR creation time.
        // This ensures we verify against the exact bytes the device signed,
        // even if transaction data was mutated after the QR was displayed.
        const txPayload = this.pendingSignRequest.txPayloadSnapshot
        if (!txPayload) {
          throw new QRSignError('Missing transaction payload snapshot', 'QR_MISSING_PAYLOAD_SNAPSHOT')
        }
        const { cleanTxData, txType, chainId } = txPayload

        log.verbose('QR signature parsed', {
          vRaw,
          recoveryId,
          txType,
          chainId,
          txEncodingStrategy: txPayload.txEncodingStrategy,
          txHashHint: txPayload.txHashHint,
          txKeccakHint: txPayload.txKeccakHint,
          txHashMode: txPayload.txHashMode,
          requestedLegacyEncoding,
          requestedLegacyHashMode
        })

        const validationAttempts: SignatureValidationAttempt[] = []

        if (txType >= 1) {
          const typedV = recoveryId.toString(16).padStart(2, '0')
          const signedTx = await sign(cleanTxData, async () => ({
            r,
            s,
            v: typedV
          }))
          const recoveredAddress = signedTx.getSenderAddress().toString().toLowerCase()
          validationAttempts.push({
            encodingId: 'typed-primary',
            hashMode: 'keccak',
            vMode: 'typed-0-1',
            v: typedV,
            txHashHint: txPayload.txHashHint,
            txKeccakHint: txPayload.txKeccakHint,
            recoveredAddress
          })

          if (recoveredAddress !== expectedAddressLower) {
            log.warn('QR transaction signature mismatch (typed)', {
              expectedAddress,
              attempts: validationAttempts
            })
            throw new QRSignError(
              `Signature verification failed: expected ${expectedAddress}`,
              'QR_SIGNATURE_ADDRESS_MISMATCH'
            )
          }

          log.verbose('QR signature validation result', {
            selectedEncoding: 'typed-primary',
            selectedHashMode: 'keccak',
            selectedVMode: 'typed-0-1',
            attempts: validationAttempts
          })

          const serializedTx = addHexPrefix(signedTx.serialize().toString('hex'))
          this.completePendingRequest()
          callback(null, serializedTx)
          return {}
        }

        const legacyCandidates = txPayload.legacyCandidates || []
        const orderedLegacyCandidates = this.orderLegacyCandidates(legacyCandidates, requestedLegacyEncoding)
        const orderedHashModes = this.orderHashModes(requestedLegacyHashMode)
        let selectedEncoding: QRTxLegacyEncoding | null = null
        let selectedHashMode: QRTxLegacyHashMode | null = null
        let selectedVMode: SignatureValidationAttempt['vMode'] | null = null
        let selectedVHex: string | null = null
        for (const encodingCandidate of orderedLegacyCandidates) {
          for (const hashMode of orderedHashModes) {
            let txHash: Buffer
            try {
              txHash = computeLegacyRecoveryHash(encodingCandidate.signDataBytes, hashMode)
            } catch (hashError) {
              validationAttempts.push({
                encodingId: encodingCandidate.encodingId,
                hashMode,
                vMode: 'legacy-eip155-v',
                v: 'n/a',
                txHashHint: encodingCandidate.hashHint,
                txKeccakHint: encodingCandidate.keccakHint,
                error: (hashError as Error).message
              })
              continue
            }

            const vModes: Array<'legacy-eip155-v' | 'legacy-27-28-v'> = ['legacy-eip155-v', 'legacy-27-28-v']

            for (const vMode of vModes) {
              try {
                const result = this.recoverLegacySignatureAddress(
                  txHash,
                  rBuffer,
                  sBuffer,
                  recoveryId,
                  chainId,
                  vMode
                )

                validationAttempts.push({
                  encodingId: encodingCandidate.encodingId,
                  hashMode,
                  vMode,
                  v: result.vHex,
                  txHashHint: encodingCandidate.hashHint,
                  txKeccakHint: encodingCandidate.keccakHint,
                  recoveredAddress: result.recoveredAddress
                })

                if (result.recoveredAddress === expectedAddressLower) {
                  selectedEncoding = encodingCandidate.encodingId
                  selectedHashMode = hashMode
                  selectedVMode = vMode
                  selectedVHex = result.vHex
                  break
                }
              } catch (error) {
                validationAttempts.push({
                  encodingId: encodingCandidate.encodingId,
                  hashMode,
                  vMode,
                  v:
                    vMode === 'legacy-eip155-v'
                      ? (chainId * 2 + 35 + recoveryId).toString(16)
                      : (27 + recoveryId).toString(16),
                  txHashHint: encodingCandidate.hashHint,
                  txKeccakHint: encodingCandidate.keccakHint,
                  error: (error as Error).message
                })
              }
            }

            if (selectedEncoding) {
              break
            }
          }

          if (selectedEncoding) {
            break
          }
        }

        if (!selectedEncoding || !selectedHashMode || !selectedVHex || !selectedVMode) {
          log.warn('QR transaction signature mismatch (legacy)', {
            expectedAddress,
            requestedLegacyEncoding,
            requestedLegacyHashMode,
            attempts: validationAttempts
          })
          throw new QRSignError(
            `Signature verification failed: expected ${expectedAddress}`,
            'QR_SIGNATURE_ADDRESS_MISMATCH'
          )
        }

        log.verbose('QR signature validation result', {
          selectedEncoding,
          selectedHashMode,
          selectedVMode,
          requestedLegacyEncoding,
          requestedLegacyHashMode,
          attempts: validationAttempts
        })

        const serializedTx = serializeSignedLegacyTransaction(cleanTxData, {
          v: selectedVHex,
          r,
          s
        })
        this.completePendingRequest()
        callback(null, serializedTx)
        return {
          selectedLegacyEncoding: selectedEncoding,
          selectedHashMode
        }
      }

      this.completePendingRequest()
      callback(null, signature)
      return {}
    } catch (err) {
      if (isRecoverableQRSignError(err)) {
        log.warn('Recoverable QR signature processing failure:', err)
        throw err
      }

      log.error('Failed to process QR signature:', err)
      this.failPendingRequest(err as Error)
      throw err
    }
  }

  private completePendingRequest() {
    this.pendingSignRequest = null
    this.status = Status.OK
    this.emit('update')
  }

  private failPendingRequest(error: Error) {
    if (!this.pendingSignRequest) return

    const { callback } = this.pendingSignRequest
    this.pendingSignRequest = null
    this.status = Status.OK
    this.emit('update')
    callback(error, undefined)
  }

  // Called by UI when user cancels the signing request
  cancelSignRequest(reason?: string) {
    if (!this.pendingSignRequest) {
      return
    }

    const { callback } = this.pendingSignRequest
    this.pendingSignRequest = null
    this.status = Status.OK
    this.emit('update')

    callback(new Error(reason || 'Signing request cancelled'), undefined)
  }

  // Check if there's a pending sign request
  hasPendingSignRequest(): boolean {
    return this.pendingSignRequest !== null
  }

  // Get current pending sign request info for UI
  getPendingSignRequest() {
    return this.pendingSignRequest
  }

  // Update device name
  setName(name: string) {
    this.name = name
    this.emit('update')
  }

  getPreferredLegacyEncoding(): QRTxLegacyEncoding | undefined {
    return this.preferredLegacyEncoding
  }

  setPreferredLegacyEncoding(encoding: QRTxLegacyEncoding) {
    if (this.preferredLegacyEncoding === encoding) return
    this.preferredLegacyEncoding = encoding
    this.emit('update')
  }

  getPreferredLegacyHashMode(): QRTxLegacyHashMode | undefined {
    return this.preferredLegacyHashMode
  }

  setPreferredLegacyHashMode(hashMode: QRTxLegacyHashMode) {
    if (this.preferredLegacyHashMode === hashMode) return
    this.preferredLegacyHashMode = hashMode
    this.emit('update')
  }

  // Get device metadata for storage
  getDeviceData(): QRDeviceData {
    return {
      profileId: this.profileId,
      masterFingerprint: this.masterFingerprint,
      xpub: this.xpub,
      derivationPath: this.derivationPath,
      ...(this.accountSource ? { accountSource: this.accountSource } : {}),
      ...(this.childrenPath ? { childrenPath: this.childrenPath } : {}),
      ...(this.preferredLegacyEncoding ? { preferredLegacyEncoding: this.preferredLegacyEncoding } : {}),
      ...(this.preferredLegacyHashMode ? { preferredLegacyHashMode: this.preferredLegacyHashMode } : {}),
      name: this.name
    }
  }
}
