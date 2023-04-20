import crypto from 'crypto'

export function stringToKey(pass: string) {
  const hash = crypto.createHash('sha256').update(pass)
  return Buffer.from(hash.digest('hex').substring(0, 32))
}
