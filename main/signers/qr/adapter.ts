import log from 'electron-log'
import { v4 as uuidv4 } from 'uuid'
import { addHexPrefix } from '@ethereumjs/util'

import { TransactionData } from '../../../resources/domain/transaction'
import { SignerAdapter } from '../adapters'
import store from '../../store'
import QRSigner from './QRSigner'
import { QRDeviceData } from './types'
import { encodeEthSignRequest, normalizeQRDeviceData } from './ur-utils'
import { QRTxEncodingStrategy, QRTxLegacyHashMode } from './transaction-utils'
import { QRSignError, isRecoverableQRSignError } from './errors'

interface QRSignRequest {
  type: 'transaction' | 'message' | 'typedData'
  index: number
  address: string
  message?: string
  transaction?: TransactionData
  typedData?: any
  txPayload?: {
    signData: string
    isTypedTransaction: boolean
    chainId: number
    txType: number
    txEncodingStrategy: string
    txHashMode: string
    txHashHint: string
    txKeccakHint: string
  }
}

interface QRVerifyAddressRequest {
  signerId: string
  index: number
  address: string
}

interface PendingQRSignRequest {
  requestId: string
  type: 'transaction' | 'message' | 'typedData'
  index: number
  expectedAddress: string
  resolvedDerivationPath: string
  createdAt: number
  txEncodingStrategy?: QRTxEncodingStrategy
  txHashMode?: QRTxLegacyHashMode
  txHashHint?: string
  txKeccakHint?: string
  txMeta?: {
    chainId: number
    txType: number
    txEncodingStrategy: QRTxEncodingStrategy
    txHashMode: QRTxLegacyHashMode
    txHashHint: string
    txKeccakHint: string
  }
}

function normalizeRequestId(requestId?: string): string {
  return (requestId || '').trim().toLowerCase()
}

function parseTypedDataChainId(typedData: any): number {
  const domainChainId = typedData?.domain?.chainId
  if (domainChainId === undefined || domainChainId === null) return 1

  const numeric = Number(domainChainId)
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric
  }

  const parsed = parseInt(domainChainId.toString(), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export default class QRSignerAdapter extends SignerAdapter {
  private knownSigners: { [id: string]: QRSigner }
  private loadingSigners: { [profileId: string]: Promise<QRSigner> }
  private pendingSignRequests: { [signerId: string]: PendingQRSignRequest }
  private observer: any

  constructor() {
    super('qr')

    this.knownSigners = {}
    this.loadingSigners = {}
    this.pendingSignRequests = {}
  }

  open() {
    // Clear any stale QR sign request from previous session
    const staleSignRequest = store('main.qr.signRequest')
    if (staleSignRequest) {
      log.warn('Clearing stale QR sign request on adapter open', {
        signerId: staleSignRequest.signerId,
        requestId: staleSignRequest.requestId
      })
      store.clearQRSignRequest()
    }

    const staleVerifyAddress = store('main.qr.verifyAddress')
    if (staleVerifyAddress) {
      log.warn('Clearing stale QR verify address on adapter open')
      store.clearQRVerifyAddress()
    }

    this.observer = store.observer(() => {
      const rawDevices = (store('main.qr.devices') || {}) as Record<string, Partial<QRDeviceData>>
      const { devices: qrDevices, changed } = this.normalizeStoredDevices(rawDevices)

      if (changed) {
        store.setQRDevices(qrDevices)
      }

      Object.values(qrDevices).forEach((deviceData) => {
        const existingSigner = this.getSignerByProfileId(deviceData.profileId)

        if (!existingSigner && deviceData) {
          this.loadDevice(deviceData).catch((err) => {
            log.error(`Failed loading QR profile ${deviceData.profileId}:`, err)
          })
        }
      })

      const storedProfiles = new Set(Object.keys(qrDevices))
      Object.values(this.knownSigners).forEach((signer) => {
        if (!storedProfiles.has(signer.profileId)) {
          this.removeSigner(signer)
        }
      })
    }, 'qrSigners')

    super.open()
  }

  private getSignerByProfileId(profileId: string): QRSigner | undefined {
    return Object.values(this.knownSigners).find((signer) => signer.profileId === profileId)
  }

  private normalizeStoredDevices(rawDevices: Record<string, Partial<QRDeviceData>>): {
    devices: Record<string, QRDeviceData>
    changed: boolean
  } {
    let changed = false
    const devices: Record<string, QRDeviceData> = {}

    Object.entries(rawDevices).forEach(([storedKey, rawDevice]) => {
      if (!rawDevice) {
        changed = true
        return
      }

      const normalizedDevice = normalizeQRDeviceData(rawDevice)

      if (storedKey !== normalizedDevice.profileId) {
        changed = true
      }

      if (
        rawDevice.profileId !== normalizedDevice.profileId ||
        rawDevice.masterFingerprint !== normalizedDevice.masterFingerprint ||
        rawDevice.derivationPath !== normalizedDevice.derivationPath ||
        rawDevice.accountSource !== normalizedDevice.accountSource ||
        rawDevice.childrenPath !== normalizedDevice.childrenPath ||
        rawDevice.preferredLegacyEncoding !== normalizedDevice.preferredLegacyEncoding ||
        rawDevice.preferredLegacyHashMode !== normalizedDevice.preferredLegacyHashMode
      ) {
        changed = true
      }

      if (devices[normalizedDevice.profileId]) {
        changed = true
      }

      devices[normalizedDevice.profileId] = normalizedDevice
    })

    return { devices, changed }
  }

  close() {
    if (this.observer) {
      this.observer.remove()
      this.observer = null
    }

    Object.values(this.knownSigners).forEach((signer) => {
      this.clearPendingRequestContext(signer.id)
      signer.close()
    })

    this.knownSigners = {}
    this.loadingSigners = {}
    this.pendingSignRequests = {}

    super.close()
  }

  remove(signer: QRSigner) {
    this.removeSigner(signer)
  }

  reload(signer: QRSigner) {
    log.info(`Reloading QR signer: ${signer.name}`)

    const deviceData = signer.getDeviceData()
    this.removeSignerObject(signer)
    this.loadDevice(deviceData)
  }

  private removeSignerObject(signer: QRSigner) {
    if (signer.id in this.knownSigners) {
      this.clearPendingRequestContext(signer.id)
      delete this.knownSigners[signer.id]
      signer.close()
    }
  }

  async importDevice(deviceData: QRDeviceData): Promise<QRSigner> {
    const normalizedDeviceData = normalizeQRDeviceData(deviceData)
    log.info(
      `Importing QR device: ${normalizedDeviceData.name} (${normalizedDeviceData.masterFingerprint}, profile ${normalizedDeviceData.profileId})`
    )

    const existing = this.getSignerByProfileId(normalizedDeviceData.profileId)
    if (existing) {
      log.info(`QR profile already imported: ${normalizedDeviceData.profileId}`)
      return existing
    }

    const currentDevices = (store('main.qr.devices') || {}) as Record<string, Partial<QRDeviceData>>
    const { devices: normalizedDevices } = this.normalizeStoredDevices(currentDevices)
    store.setQRDevices({
      ...normalizedDevices,
      [normalizedDeviceData.profileId]: normalizedDeviceData
    })

    try {
      return await this.loadDevice(normalizedDeviceData)
    } catch (err) {
      const updatedDevices = {
        ...(store('main.qr.devices') || {})
      } as Record<string, QRDeviceData>
      delete updatedDevices[normalizedDeviceData.profileId]
      store.setQRDevices(updatedDevices)
      throw err
    }
  }

  getSigner(id: string): QRSigner | undefined {
    return this.knownSigners[id]
  }

  getAllSigners(): QRSigner[] {
    return Object.values(this.knownSigners)
  }

  async submitSignature(signerId: string, signature: string, requestId?: string) {
    const signer = this.knownSigners[signerId]
    if (!signer) {
      throw new QRSignError(`QR signer not found: ${signerId}`, 'QR_SIGNER_NOT_FOUND', false)
    }

    const pendingRequest = this.pendingSignRequests[signerId]
    if (!pendingRequest) {
      this.clearPendingRequestContext(signerId, true)
      throw new QRSignError('No pending QR sign request', 'QR_NO_PENDING_REQUEST', false)
    }

    if (!signer.hasPendingSignRequest()) {
      this.clearPendingRequestContext(signerId, true)
      throw new QRSignError('QR signer has no active sign request', 'QR_NO_PENDING_REQUEST', false)
    }

    // Validate signer has txPayloadSnapshot for transaction requests
    if (pendingRequest.type === 'transaction') {
      const signerRequest = signer.getPendingSignRequest()
      if (!signerRequest?.txPayloadSnapshot) {
        log.error('Signer missing txPayloadSnapshot for transaction request', {
          signerId,
          requestId: pendingRequest.requestId
        })
        this.clearPendingRequestContext(signerId, true)
        signer.cancelSignRequest('Missing transaction payload')
        throw new QRSignError(
          'Transaction payload not found - please retry signing',
          'QR_MISSING_PAYLOAD',
          false
        )
      }

      // Validate hash hints match between adapter and signer state
      const adapterHashHint = pendingRequest.txHashHint
      const signerHashHint = signerRequest.txPayloadSnapshot.txHashHint
      if (adapterHashHint && signerHashHint && adapterHashHint !== signerHashHint) {
        log.error('State mismatch: txHashHint differs between adapter and signer', {
          signerId,
          adapterHashHint,
          signerHashHint
        })
        this.clearPendingRequestContext(signerId, true)
        signer.cancelSignRequest('Transaction payload mismatch')
        throw new QRSignError('Transaction state mismatch - please retry signing', 'QR_STATE_MISMATCH', false)
      }
    }

    const normalizedRequestId = normalizeRequestId(requestId)
    if (!normalizedRequestId) {
      throw new QRSignError(
        'Scanned signature is missing requestId metadata',
        'QR_SIGNATURE_REQUEST_ID_MISSING'
      )
    }

    if (normalizedRequestId !== normalizeRequestId(pendingRequest.requestId)) {
      throw new QRSignError(
        `Signature requestId mismatch (received=${normalizedRequestId}, expected=${pendingRequest.requestId})`,
        'QR_SIGNATURE_REQUEST_ID_MISMATCH'
      )
    }

    try {
      const result = await signer.submitSignature(signature, {
        txEncodingStrategy: pendingRequest.txEncodingStrategy,
        txHashMode: pendingRequest.txHashMode
      })

      const selectedLegacyEncoding = result?.selectedLegacyEncoding
      const selectedHashMode = result?.selectedHashMode
      const shouldPersistEncoding =
        !!selectedLegacyEncoding && selectedLegacyEncoding !== signer.getPreferredLegacyEncoding()
      const shouldPersistHashMode =
        !!selectedHashMode && selectedHashMode !== signer.getPreferredLegacyHashMode()

      if (shouldPersistEncoding && selectedLegacyEncoding) {
        signer.setPreferredLegacyEncoding(selectedLegacyEncoding)
      }

      if (shouldPersistHashMode && selectedHashMode) {
        signer.setPreferredLegacyHashMode(selectedHashMode)
      }

      if (shouldPersistEncoding || shouldPersistHashMode) {
        this.persistSignerDeviceData(signer)
        log.info('Updated QR signer compatibility preference', {
          signerId,
          selectedLegacyEncoding,
          selectedHashMode
        })
      }

      this.clearPendingRequestContext(signerId, true)
    } catch (error) {
      // Auto-reset encoding preferences on address mismatch so next retry uses defaults
      if (error instanceof QRSignError && error.code === 'QR_SIGNATURE_ADDRESS_MISMATCH') {
        signer.clearPreferredLegacySettings()
        this.persistSignerDeviceData(signer)
        log.info('Reset QR signer legacy preferences after signature mismatch', { signerId })
      }

      if (isRecoverableQRSignError(error)) {
        throw error
      }

      this.clearPendingRequestContext(signerId, true)
      throw error
    }
  }

  cancelSignRequest(signerId: string, reason?: string) {
    const signer = this.knownSigners[signerId]
    if (signer) {
      signer.cancelSignRequest(reason)
    }
    this.clearPendingRequestContext(signerId, true)
  }

  private async loadDevice(deviceData: QRDeviceData): Promise<QRSigner> {
    const normalizedDeviceData = normalizeQRDeviceData(deviceData)
    log.info(`Loading QR device: ${normalizedDeviceData.name} (${normalizedDeviceData.profileId})`)

    const existingId = Object.keys(this.knownSigners).find((id) => {
      return this.knownSigners[id].profileId === normalizedDeviceData.profileId
    })
    if (existingId) {
      return this.knownSigners[existingId]
    }

    const pendingLoad = this.loadingSigners[normalizedDeviceData.profileId]
    if (pendingLoad) {
      return pendingLoad
    }

    const loadPromise = (async () => {
      const signer = new QRSigner(normalizedDeviceData)
      this.setupSignerEvents(signer)

      await signer.open()

      this.knownSigners[signer.id] = signer
      this.emit('add', signer)

      log.info(
        `Loaded QR device: ${normalizedDeviceData.name} (${normalizedDeviceData.profileId}) with ${signer.addresses.length} addresses`
      )
      return signer
    })()

    this.loadingSigners[normalizedDeviceData.profileId] = loadPromise

    try {
      return await loadPromise
    } finally {
      delete this.loadingSigners[normalizedDeviceData.profileId]
    }
  }

  private setupSignerEvents(signer: QRSigner) {
    const emitUpdate = () => this.emit('update', signer)

    signer.on('update', emitUpdate)
    signer.on('error', emitUpdate)

    signer.on('close', () => {
      this.clearPendingRequestContext(signer.id, true)
      delete this.knownSigners[signer.id]
      this.emit('remove', signer.id)
    })

    signer.on('sign-request', (request: QRSignRequest) => {
      log.info('QR signer sign request:', request.type)

      try {
        // Clear any stale state from previous requests before processing new request
        if (this.pendingSignRequests[signer.id]) {
          log.warn('Clearing stale pending request for signer before new request', {
            signerId: signer.id,
            oldRequestId: this.pendingSignRequests[signer.id].requestId
          })
          delete this.pendingSignRequests[signer.id]
        }

        const resolvedDerivation = signer.resolveDerivation(request.index, request.address)
        if (!resolvedDerivation.matchesExpectedAddress) {
          throw new QRSignError(
            `Unable to resolve derivation path for requested address ${request.address} (resolved ${resolvedDerivation.address} via ${resolvedDerivation.fullPath})`,
            'QR_DERIVATION_ADDRESS_MISMATCH',
            false
          )
        }

        const requestId = uuidv4().toLowerCase()
        let urData: { urData: string; animated: boolean; frames?: string[] }
        let txMeta: PendingQRSignRequest['txMeta']

        if (request.type === 'transaction') {
          // Use pre-built payload from QRSigner (single source of truth for byte consistency)
          const txPayload = request.txPayload
          if (!txPayload) {
            throw new QRSignError(
              'Missing transaction payload in sign request',
              'QR_MISSING_TX_PAYLOAD',
              false
            )
          }

          txMeta = {
            chainId: txPayload.chainId,
            txType: txPayload.txType,
            txEncodingStrategy: txPayload.txEncodingStrategy as QRTxEncodingStrategy,
            txHashMode: txPayload.txHashMode as QRTxLegacyHashMode,
            txHashHint: txPayload.txHashHint,
            txKeccakHint: txPayload.txKeccakHint
          }

          urData = encodeEthSignRequest(
            requestId,
            txPayload.signData, // Uses pre-built bytes from QRSigner
            txPayload.isTypedTransaction ? 'typedTransaction' : 'transaction',
            txPayload.chainId,
            resolvedDerivation.fullPath,
            request.address,
            signer.masterFingerprint
          )
        } else if (request.type === 'message') {
          const signData = request.message || ''

          urData = encodeEthSignRequest(
            requestId,
            signData,
            'message',
            1,
            resolvedDerivation.fullPath,
            request.address,
            signer.masterFingerprint
          )
        } else if (request.type === 'typedData') {
          const typedMessage = request.typedData
          const typedData = typedMessage?.data || {}
          const chainId = parseTypedDataChainId(typedData)
          const signData = addHexPrefix(Buffer.from(JSON.stringify(typedData)).toString('hex'))

          urData = encodeEthSignRequest(
            requestId,
            signData,
            'typedData',
            chainId,
            resolvedDerivation.fullPath,
            request.address,
            signer.masterFingerprint
          )
          txMeta = {
            chainId,
            txType: -1,
            txEncodingStrategy: 'primary',
            txHashMode: 'keccak',
            txHashHint: '0x',
            txKeccakHint: '0x'
          }
        } else {
          throw new QRSignError(
            `Unsupported sign request type: ${request.type}`,
            'QR_REQUEST_TYPE_UNSUPPORTED',
            false
          )
        }

        this.pendingSignRequests[signer.id] = {
          requestId,
          type: request.type,
          index: request.index,
          expectedAddress: request.address,
          resolvedDerivationPath: resolvedDerivation.fullPath,
          createdAt: Date.now(),
          txEncodingStrategy: txMeta?.txEncodingStrategy,
          txHashMode: txMeta?.txHashMode,
          txHashHint: txMeta?.txHashHint,
          txKeccakHint: txMeta?.txKeccakHint,
          ...(txMeta ? { txMeta } : {})
        }

        store.setQRSignRequest(signer.id, {
          ...request,
          requestId,
          urData: urData.urData,
          animated: urData.animated,
          frames: urData.frames,
          addressIndex: request.index,
          expectedAddress: request.address,
          resolvedDerivationPath: resolvedDerivation.fullPath,
          txEncodingStrategy: txMeta?.txEncodingStrategy || 'primary',
          txHashMode: txMeta?.txHashMode || 'keccak',
          txHashHint: txMeta?.txHashHint || '0x',
          txKeccakHint: txMeta?.txKeccakHint || '0x',
          txMeta
        })
      } catch (err) {
        log.error('Failed to encode sign request as UR:', err)
        this.clearPendingRequestContext(signer.id, true)
        signer.cancelSignRequest((err as Error).message || 'Failed to prepare QR sign request')
      }
    })

    signer.on('verify-address', (data: QRVerifyAddressRequest) => {
      store.setQRVerifyAddress(signer.id, data)
    })
  }

  private clearPendingRequestContext(signerId: string, clearStore = false) {
    const hadPendingRequest = !!this.pendingSignRequests[signerId]

    if (this.pendingSignRequests[signerId]) {
      delete this.pendingSignRequests[signerId]
    }

    // Also clear signer pending request for consistency
    const signer = this.knownSigners[signerId]
    if (signer && signer.hasPendingSignRequest()) {
      signer.clearPendingRequestSilently()
    }

    if (!clearStore) {
      if (hadPendingRequest) {
        log.warn('Cleared adapter state but NOT store state', { signerId })
      }
      return
    }

    const currentSignRequest = store('main.qr.signRequest')
    if (currentSignRequest?.signerId === signerId) {
      store.clearQRSignRequest()
    } else if (currentSignRequest) {
      log.warn('Store has different signerId, not clearing', {
        expected: signerId,
        actual: currentSignRequest.signerId
      })
    }
  }

  private persistSignerDeviceData(signer: QRSigner) {
    const currentDevices = (store('main.qr.devices') || {}) as Record<string, QRDeviceData>
    store.setQRDevices({
      ...currentDevices,
      [signer.profileId]: signer.getDeviceData()
    })
  }

  private removeSigner(signer: QRSigner) {
    if (signer.id in this.knownSigners) {
      log.info(`Removing QR signer: ${signer.name}`)

      this.clearPendingRequestContext(signer.id, true)
      delete this.knownSigners[signer.id]

      const currentDevices = (store('main.qr.devices') || {}) as Record<string, QRDeviceData>
      const { [signer.profileId]: removed, ...rest } = currentDevices
      store.setQRDevices(rest)

      signer.close()
    }
  }
}
