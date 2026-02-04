export const Status = {
  INITIAL: 'Connecting',
  OK: 'ok',
  DERIVING: 'addresses',
  DISCONNECTED: 'Disconnected',
  AWAITING_SIGNATURE: 'Sign with device',
  ERROR: 'Error'
}

export interface QRDeviceData {
  // Stable profile identifier for a specific derivation/source combination
  profileId: string
  // Master fingerprint of the device (hex string)
  masterFingerprint: string
  // Extended public key
  xpub: string
  // Derivation path template (e.g., "m/44'/60'/0'/0")
  derivationPath: string
  // Optional account source (e.g., account.standard, account.ledger_live)
  accountSource?: string
  // Optional child keypath metadata from UR hd-key children
  childrenPath?: string
  // Device name set by user
  name: string
}

export interface URSignRequest {
  // The UR-encoded unsigned transaction
  urData: string
  // Whether this requires animated QR (large payload)
  animated: boolean
  // The individual QR frames if animated
  frames?: string[]
}

export interface URSignature {
  // The signature bytes (r, s, v)
  signature: string
  // Recovery parameter
  v: number
}
