import log from 'electron-log'
import { v4 as uuidv4 } from 'uuid'
import { TransactionFactory } from '@ethereumjs/tx'
import { RLP } from '@ethereumjs/rlp'
import { addHexPrefix } from '@ethereumjs/util'
import { SignerAdapter } from '../adapters'
import chainConfig from '../../chains/config'
import QRSigner from './QRSigner'
import { QRDeviceData } from './types'
import { encodeEthSignRequest, normalizeQRDeviceData } from './ur-utils'
import store from '../../store'

interface QRSignRequest {
  signerId: string
  type: 'transaction' | 'message' | 'typedData'
  index: number
  address: string
  data?: any
}

interface QRVerifyAddressRequest {
  signerId: string
  index: number
  address: string
}

export default class QRSignerAdapter extends SignerAdapter {
  private knownSigners: { [id: string]: QRSigner }
  private loadingSigners: { [profileId: string]: Promise<QRSigner> }
  private observer: any

  constructor() {
    super('qr')

    this.knownSigners = {}
    this.loadingSigners = {}
  }

  open() {
    // Watch for store changes to QR devices and load them
    this.observer = store.observer(() => {
      const rawDevices = (store('main.qr.devices') || {}) as Record<string, Partial<QRDeviceData>>
      const { devices: qrDevices, changed } = this.normalizeStoredDevices(rawDevices)

      if (changed) {
        store.setQRDevices(qrDevices)
      }

      log.verbose('QR adapter observer: devices in store:', Object.keys(qrDevices))

      // Load any new devices that were added
      Object.values(qrDevices).forEach((deviceData) => {
        // Check if we already have a signer for this device
        const existingSigner = this.getSignerByProfileId(deviceData.profileId)

        if (!existingSigner && deviceData) {
          this.loadDevice(deviceData).catch((err) => {
            log.error(`Failed loading QR profile ${deviceData.profileId}:`, err)
          })
        }
      })

      // Remove any signers whose devices were removed
      const storedProfiles = new Set(Object.keys(qrDevices))
      Object.values(this.knownSigners).forEach((signer) => {
        log.verbose(
          `QR adapter: checking signer ${signer.name} (profile: ${
            signer.profileId
          }) - exists in store: ${storedProfiles.has(signer.profileId)}`
        )
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
        rawDevice.childrenPath !== normalizedDevice.childrenPath
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

    // Close all signers
    Object.values(this.knownSigners).forEach((signer) => {
      signer.close()
    })

    this.knownSigners = {}
    this.loadingSigners = {}

    super.close()
  }

  remove(signer: QRSigner) {
    this.removeSigner(signer)
  }

  reload(signer: QRSigner) {
    log.info(`Reloading QR signer: ${signer.name}`)

    const deviceData = signer.getDeviceData()
    this.removeSignerObject(signer) // Don't remove from store during reload

    // Re-create the signer
    this.loadDevice(deviceData)
  }

  // Remove signer object from memory only (for reload, doesn't touch store)
  private removeSignerObject(signer: QRSigner) {
    if (signer.id in this.knownSigners) {
      delete this.knownSigners[signer.id]
      signer.close()
    }
  }

  // Import a new QR device from scanned sync QR data
  async importDevice(deviceData: QRDeviceData): Promise<QRSigner> {
    const normalizedDeviceData = normalizeQRDeviceData(deviceData)
    log.info(
      `Importing QR device: ${normalizedDeviceData.name} (${normalizedDeviceData.masterFingerprint}, profile ${normalizedDeviceData.profileId})`
    )

    // Check if profile already exists
    const existing = this.getSignerByProfileId(normalizedDeviceData.profileId)

    if (existing) {
      log.info(`QR profile already imported: ${normalizedDeviceData.profileId}`)
      return existing
    }

    // Persist to store
    const currentDevices = (store('main.qr.devices') || {}) as Record<string, Partial<QRDeviceData>>
    const { devices: normalizedDevices } = this.normalizeStoredDevices(currentDevices)
    store.setQRDevices({
      ...normalizedDevices,
      [normalizedDeviceData.profileId]: normalizedDeviceData
    })

    // Directly load the device instead of waiting for observer
    try {
      const signer = await this.loadDevice(normalizedDeviceData)
      return signer
    } catch (err) {
      // Clean up on failure - remove from store
      const updatedDevices = {
        ...(store('main.qr.devices') || {})
      } as Record<string, QRDeviceData>
      delete updatedDevices[normalizedDeviceData.profileId]
      store.setQRDevices(updatedDevices)
      throw err
    }
  }

  // Get a signer by ID
  getSigner(id: string): QRSigner | undefined {
    return this.knownSigners[id]
  }

  // Get all QR signers
  getAllSigners(): QRSigner[] {
    return Object.values(this.knownSigners)
  }

  // Submit a signature for a pending sign request
  submitSignature(signerId: string, signature: string) {
    const signer = this.knownSigners[signerId]
    if (signer) {
      signer.submitSignature(signature)
      store.clearQRSignRequest()
    }
  }

  // Cancel a pending sign request
  cancelSignRequest(signerId: string, reason?: string) {
    const signer = this.knownSigners[signerId]
    if (signer) {
      signer.cancelSignRequest(reason)
      store.clearQRSignRequest()
    }
  }

  private async loadDevice(deviceData: QRDeviceData): Promise<QRSigner> {
    const normalizedDeviceData = normalizeQRDeviceData(deviceData)
    log.info(`Loading QR device: ${normalizedDeviceData.name} (${normalizedDeviceData.profileId})`)

    // Check if already loaded
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
      delete this.knownSigners[signer.id]
      this.emit('remove', signer.id)
    })

    // Handle sign request events - encode as UR and forward to store for UI to display
    signer.on('sign-request', (request: any) => {
      log.info('QR signer sign request:', request.type)

      try {
        const requestId = uuidv4() // Keep dashes - Keystone library requires proper UUID format
        // Ensure derivation path has m/ prefix for Keystone library
        const basePath = signer.derivationPath.startsWith('m/')
          ? signer.derivationPath
          : `m/${signer.derivationPath}`
        const derivationPath = `${basePath}/0/${request.index}`
        let urData: { urData: string; animated: boolean; frames?: string[] }

        if (request.type === 'transaction') {
          // Serialize unsigned transaction
          const rawTx = request.transaction
          const chainId = parseInt(rawTx.chainId, 16)
          const txType = parseInt(rawTx.type || '0x0', 16)
          const isTypedTx = txType >= 1 // EIP-2930 (type 1) and EIP-1559 (type 2) are typed transactions

          // CRITICAL: Clean transaction object - remove extra fields that @ethereumjs/tx doesn't recognize
          // Fields like gasFeesSource, recipientType, feesUpdated, warning, from cause silent serialization failures
          const cleanTxData: Record<string, any> = {
            chainId: rawTx.chainId,
            type: rawTx.type,
            nonce: rawTx.nonce,
            to: rawTx.to,
            value: rawTx.value,
            data: rawTx.data,
            gasLimit: rawTx.gasLimit || rawTx.gas
          }

          // Add gas fields based on transaction type
          if (txType === 2) {
            // EIP-1559
            cleanTxData.maxFeePerGas = rawTx.maxFeePerGas
            cleanTxData.maxPriorityFeePerGas = rawTx.maxPriorityFeePerGas
          } else if (txType === 1) {
            // EIP-2930
            cleanTxData.gasPrice = rawTx.gasPrice
          } else {
            // Legacy
            cleanTxData.gasPrice = rawTx.gasPrice
          }

          // AccessList for EIP-2930/1559
          if (rawTx.accessList) {
            cleanTxData.accessList = rawTx.accessList
          }

          // Use chainConfig for consistency with the rest of the codebase
          const hardfork = txType === 2 ? 'london' : 'berlin'
          const common = chainConfig(chainId, hardfork)

          const tx = TransactionFactory.fromTxData(cleanTxData, { common })
          const unsignedTxBytes = tx.getMessageToSign(false) // false = don't hash

          // For legacy transactions (type 0), getMessageToSign returns an array of raw values
          // that need to be RLP encoded. For typed transactions, it returns Uint8Array directly.
          let serializedBytes: Uint8Array
          if (Array.isArray(unsignedTxBytes)) {
            // Legacy transaction - RLP encode the raw values array
            serializedBytes = RLP.encode(unsignedTxBytes)
          } else {
            // Typed transaction - already serialized
            serializedBytes = unsignedTxBytes
          }

          const signData = addHexPrefix(Buffer.from(serializedBytes).toString('hex'))

          urData = encodeEthSignRequest(
            requestId,
            signData,
            isTypedTx ? 'typedTransaction' : 'transaction',
            chainId,
            derivationPath,
            request.address,
            signer.masterFingerprint
          )
        } else if (request.type === 'message') {
          // Hash the personal message
          const msgBuffer = Buffer.from(request.message)
          const signData = addHexPrefix(msgBuffer.toString('hex'))

          urData = encodeEthSignRequest(
            requestId,
            signData,
            'message',
            1, // chainId for message signing
            derivationPath,
            request.address,
            signer.masterFingerprint
          )
        } else if (request.type === 'typedData') {
          // For QR signing, send raw typed data JSON - hardware wallet will parse, display, hash, and sign
          // TypedMessage wraps the actual typed data in a 'data' property
          const typedMessage = request.typedData
          const typedData = typedMessage.data
          const signData = addHexPrefix(Buffer.from(JSON.stringify(typedData)).toString('hex'))

          // Extract chainId from domain, default to 1
          const chainId = parseInt(typedData.domain?.chainId?.toString() || '1')

          urData = encodeEthSignRequest(
            requestId,
            signData,
            'typedData',
            chainId,
            derivationPath,
            request.address,
            signer.masterFingerprint
          )
        } else {
          throw new Error(`Unsupported sign request type: ${request.type}`)
        }

        store.setQRSignRequest(signer.id, {
          ...request,
          requestId,
          urData: urData.urData,
          animated: urData.animated,
          frames: urData.frames
        })
      } catch (err) {
        log.error('Failed to encode sign request as UR:', err)
        // Fall back to raw data
        store.setQRSignRequest(signer.id, request)
      }
    })

    signer.on('verify-address', (data: QRVerifyAddressRequest) => {
      log.info('QR signer verify address request:', data)
      store.setQRVerifyAddress(signer.id, data)
    })
  }

  private removeSigner(signer: QRSigner) {
    if (signer.id in this.knownSigners) {
      log.info(`Removing QR signer: ${signer.name}`)

      delete this.knownSigners[signer.id]

      // Remove from store
      const currentDevices = (store('main.qr.devices') || {}) as Record<string, QRDeviceData>
      const { [signer.profileId]: removed, ...rest } = currentDevices
      store.setQRDevices(rest)

      signer.close()
    }
  }
}
