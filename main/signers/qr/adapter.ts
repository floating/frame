import log from 'electron-log'
import { v4 as uuidv4 } from 'uuid'
import { TransactionFactory } from '@ethereumjs/tx'
import { Common } from '@ethereumjs/common'
import { addHexPrefix } from '@ethereumjs/util'
import { SignerAdapter } from '../adapters'
import QRSigner from './QRSigner'
import { QRDeviceData } from './types'
import { encodeEthSignRequest } from './ur-utils'
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
  private observer: any

  constructor() {
    super('qr')

    this.knownSigners = {}
  }

  open() {
    // Watch for store changes to QR devices and load them
    this.observer = store.observer(() => {
      const qrDevices: Record<string, QRDeviceData> = store('main.qr.devices') || {}
      log.verbose('QR adapter observer: devices in store:', Object.keys(qrDevices))

      // Load any new devices that were added
      Object.entries(qrDevices).forEach(([fingerprint, deviceData]) => {
        // Check if we already have a signer for this device
        const existingSigner = Object.values(this.knownSigners).find(
          (s) => s.masterFingerprint === fingerprint
        )

        if (!existingSigner && deviceData) {
          this.loadDevice(deviceData)
        }
      })

      // Remove any signers whose devices were removed
      Object.values(this.knownSigners).forEach((signer) => {
        log.verbose(`QR adapter: checking signer ${signer.name} (fingerprint: ${signer.masterFingerprint}) - exists in store: ${!!qrDevices[signer.masterFingerprint]}`)
        if (!qrDevices[signer.masterFingerprint]) {
          this.removeSigner(signer)
        }
      })
    }, 'qrSigners')

    super.open()
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

    super.close()
  }

  remove(signer: QRSigner) {
    this.removeSigner(signer)
  }

  reload(signer: QRSigner) {
    log.info(`Reloading QR signer: ${signer.name}`)

    const deviceData = signer.getDeviceData()
    this.removeSignerObject(signer)  // Don't remove from store during reload

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
    log.info(`Importing QR device: ${deviceData.name} (${deviceData.masterFingerprint})`)

    // Check if device already exists
    const existing = Object.values(this.knownSigners).find(
      (s) => s.masterFingerprint === deviceData.masterFingerprint
    )

    if (existing) {
      log.info(`QR device already imported: ${deviceData.masterFingerprint}`)
      return existing
    }

    // Persist to store
    const currentDevices = store('main.qr.devices') || {}
    store.setQRDevices({
      ...currentDevices,
      [deviceData.masterFingerprint]: deviceData
    })

    // Directly load the device instead of waiting for observer
    try {
      const signer = await this.loadDevice(deviceData)
      return signer
    } catch (err) {
      // Clean up on failure - remove from store
      const updatedDevices = { ...store('main.qr.devices') }
      delete updatedDevices[deviceData.masterFingerprint]
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
    log.info(`Loading QR device: ${deviceData.name}`)

    // Check if already loaded
    const existingId = Object.keys(this.knownSigners).find(
      (id) => this.knownSigners[id].masterFingerprint === deviceData.masterFingerprint
    )
    if (existingId) {
      return this.knownSigners[existingId]
    }

    const signer = new QRSigner(deviceData)
    this.setupSignerEvents(signer)

    await signer.open()

    this.knownSigners[signer.id] = signer
    this.emit('add', signer)

    log.info(`Loaded QR device: ${deviceData.name} with ${signer.addresses.length} addresses`)
    return signer
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
        const requestId = uuidv4()  // Keep dashes - Keystone library requires proper UUID format
        // Ensure derivation path has m/ prefix for Keystone library
        const basePath = signer.derivationPath.startsWith('m/') ? signer.derivationPath : `m/${signer.derivationPath}`
        const derivationPath = `${basePath}/0/${request.index}`
        let urData: { urData: string; animated: boolean; frames?: string[] }

        if (request.type === 'transaction') {
          // Serialize unsigned transaction
          const rawTx = request.transaction
          const chainId = parseInt(rawTx.chainId, 16)
          const txType = parseInt(rawTx.type || '0x0', 16)
          const isTypedTx = txType >= 1 // EIP-2930 (type 1) and EIP-1559 (type 2) are typed transactions
          const hardfork = txType === 2 ? 'london' : 'berlin'
          const common = Common.custom({ chainId }, { hardfork })

          const tx = TransactionFactory.fromTxData(rawTx, { common })
          const unsignedTxBytes = tx.getMessageToSign(false) // false = don't hash
          // getMessageToSign returns Uint8Array or Uint8Array[] - handle both cases
          const bytesArray = Array.isArray(unsignedTxBytes) ? unsignedTxBytes[0] : unsignedTxBytes
          const signData = addHexPrefix(Buffer.from(bytesArray).toString('hex'))

          log.verbose('Encoding transaction for QR:', { chainId, txType, isTypedTx, derivationPath, masterFingerprint: signer.masterFingerprint, signDataLength: signData.length })

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

        log.verbose('Generated UR data:', { animated: urData.animated, framesCount: urData.frames?.length || 1 })

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
      const currentDevices = store('main.qr.devices') || {}
      const { [signer.masterFingerprint]: removed, ...rest } = currentDevices
      store.setQRDevices(rest)

      signer.close()
    }
  }
}
