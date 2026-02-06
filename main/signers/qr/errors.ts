export class QRSignError extends Error {
  code: string
  recoverable: boolean

  constructor(message: string, code: string, recoverable = true) {
    super(message)
    this.name = 'QRSignError'
    this.code = code
    this.recoverable = recoverable
  }
}

export function isRecoverableQRSignError(error: unknown): boolean {
  return error instanceof QRSignError && error.recoverable
}
