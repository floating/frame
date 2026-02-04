import log from 'electron-log'
import { v5 as uuid } from 'uuid'
import { hdkey } from 'ethereumjs-wallet'
import { addHexPrefix, pubToAddress, toChecksumAddress, stripHexPrefix } from '@ethereumjs/util'

import Signer from '../../Signer'
import { Status, QRDeviceData } from '../types'
import { normalizeQRDeviceData } from '../ur-utils'
import { TransactionData } from '../../../../resources/domain/transaction'
import type { TypedMessage } from '../../../accounts/types'
import { sign } from '../../../transaction'

const ns = '7e14f1e3-b8b2-5a12-9a1c-3e5f8c9d0a2b'

const DEFAULT_ADDRESS_LIMIT = 10

export default class QRSigner extends Signer {
  // Device metadata
  profileId: string
  masterFingerprint: string
  xpub: string
  derivationPath: string
  accountSource?: string
  childrenPath?: string

  // Address derivation
  private hdNode: any
  addressLimit: number = DEFAULT_ADDRESS_LIMIT

  // Pending sign request (set when waiting for user to scan QR)
  private pendingSignRequest: {
    type: 'transaction' | 'message' | 'typedData'
    index: number
    data: any
    callback: Callback<string>
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
    this.pendingSignRequest = null
  }

  private async deriveAddresses() {
    if (!this.hdNode) {
      throw new Error('HD node not initialized')
    }

    this.status = Status.DERIVING
    this.emit('update')

    const derivedAddresses: string[] = []

    // First derive to change level (0 = external chain, per BIP44)
    // Full path: m/44'/60'/0'/0/<index>
    const changeNode = this.hdNode.deriveChild(0)

    for (let i = 0; i < this.addressLimit; i++) {
      try {
        // Derive address index from change node
        const childNode = changeNode.deriveChild(i)
        const publicKey = childNode.getWallet().getPublicKey()
        const address = toChecksumAddress(addHexPrefix(pubToAddress(publicKey).toString('hex')))

        derivedAddresses.push(address)
        log.verbose(`Derived QR address #${i}: ${address}`)
      } catch (err) {
        log.error(`Failed to derive address at index ${i}:`, err)
        break
      }
    }

    this.addresses = derivedAddresses
    this.status = Status.OK
    this.emit('update')
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

    const address = this.addresses[index]
    if (!address) {
      return cb(new Error(`No address at index ${index}`), undefined)
    }

    // Store the pending request and emit event for UI to display QR
    this.pendingSignRequest = {
      type: 'transaction',
      index,
      data: { rawTx, address },
      callback: cb
    }

    this.status = Status.AWAITING_SIGNATURE
    this.emit('update')
    this.emit('sign-request', {
      type: 'transaction',
      index,
      address,
      transaction: rawTx
    })
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
  async submitSignature(signature: string) {
    if (!this.pendingSignRequest) {
      log.warn('Received signature but no pending request')
      return
    }

    const { type, data, callback } = this.pendingSignRequest
    this.pendingSignRequest = null
    this.status = Status.OK
    this.emit('update')

    log.info('QR signer received signature')

    try {
      if (type === 'transaction') {
        // For transactions, we need to apply the signature and serialize
        const rawTx = data.rawTx as TransactionData
        const expectedAddress = (rawTx.from || data.address) as string
        const sigHex = stripHexPrefix(signature)

        // Parse r, s, v from the signature (65 bytes: 32 + 32 + 1)
        const r = sigHex.slice(0, 64)
        const s = sigHex.slice(64, 128)
        const vRaw = parseInt(sigHex.slice(128, 130), 16)

        // Normalize v to recovery ID (0 or 1)
        // Keystone may return 0/1 (recovery ID) or 27/28 (legacy format)
        const recoveryId = vRaw >= 27 ? vRaw - 27 : vRaw
        if (recoveryId !== 0 && recoveryId !== 1) {
          throw new Error(`Invalid signature recovery value: ${vRaw}`)
        }

        // Get transaction type (0 = legacy, 1 = EIP-2930, 2 = EIP-1559)
        const txType = parseInt(rawTx.type || '0x0', 16)
        const chainId = parseInt(rawTx.chainId, 16)

        let v: string
        if (txType >= 1) {
          // Typed transaction (EIP-2930, EIP-1559) - v is just recovery ID (0 or 1)
          v = recoveryId.toString(16).padStart(2, '0')
        } else {
          // Legacy transaction - convert recovery ID to EIP-155 v
          // v = chainId * 2 + 35 + recovery
          const vValue = chainId * 2 + 35 + recoveryId
          v = vValue.toString(16)
        }

        log.verbose('QR signature parsed', { vRaw, recoveryId, txType, chainId })

        // CRITICAL: Clean transaction object - must match exactly what was sent to Keystone
        // Remove extra fields that @ethereumjs/tx doesn't recognize (gasFeesSource, from, etc.)
        // This ensures the signed transaction hash matches what Keystone signed
        const cleanTxData: Record<string, any> = {
          chainId: rawTx.chainId,
          type: rawTx.type,
          nonce: rawTx.nonce,
          to: rawTx.to,
          value: rawTx.value,
          data: rawTx.data,
          gasLimit: rawTx.gasLimit || (rawTx as any).gas
        }

        // Add gas fields based on transaction type
        if (txType === 2) {
          // EIP-1559
          cleanTxData.maxFeePerGas = rawTx.maxFeePerGas
          cleanTxData.maxPriorityFeePerGas = rawTx.maxPriorityFeePerGas
        } else {
          // Legacy or EIP-2930
          cleanTxData.gasPrice = rawTx.gasPrice
        }

        // AccessList for EIP-2930/1559
        if (rawTx.accessList) {
          cleanTxData.accessList = rawTx.accessList
        }

        // Use the sign helper to create a properly signed transaction
        const signedTx = await sign(cleanTxData as TransactionData, async () => ({
          r,
          s,
          v
        }))

        // Verify the recovered address matches the expected address
        const recoveredAddress = signedTx.getSenderAddress().toString().toLowerCase()
        if (recoveredAddress !== expectedAddress.toLowerCase()) {
          throw new Error(
            `Signature verification failed: recovered ${recoveredAddress}, expected ${expectedAddress}`
          )
        }

        const serializedTx = addHexPrefix(signedTx.serialize().toString('hex'))
        callback(null, serializedTx)
      } else {
        // For messages and typed data, just return the signature
        callback(null, signature)
      }
    } catch (err) {
      log.error('Failed to process QR signature:', err)
      callback(err as Error, undefined)
    }
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

  // Get device metadata for storage
  getDeviceData(): QRDeviceData {
    return {
      profileId: this.profileId,
      masterFingerprint: this.masterFingerprint,
      xpub: this.xpub,
      derivationPath: this.derivationPath,
      ...(this.accountSource ? { accountSource: this.accountSource } : {}),
      ...(this.childrenPath ? { childrenPath: this.childrenPath } : {}),
      name: this.name
    }
  }
}
