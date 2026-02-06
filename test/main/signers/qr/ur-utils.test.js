import { UREncoder } from '@ngraveio/bc-ur'
import { ETHSignature } from '@keystonehq/bc-ur-registry-eth'
import { parse as parseUuid } from 'uuid'

import { parseSignatureUR } from '../../../../main/signers/qr/ur-utils'

function encodeSignatureUR(signatureBuffer, requestIdBuffer) {
  const ethSignature = new ETHSignature(signatureBuffer, requestIdBuffer)
  const encoder = new UREncoder(ethSignature.toUR(), Infinity)

  return encoder.nextPart()
}

describe('qr ur utils', () => {
  it('parses signature UR and normalizes request ids', () => {
    const requestId = '4f7f2ca4-06d4-45e8-8573-9f51890a3434'
    const signature = Buffer.concat([Buffer.alloc(32, 0x11), Buffer.alloc(32, 0x22), Buffer.from([1])])
    const ur = encodeSignatureUR(signature, Buffer.from(parseUuid(requestId)))

    const parsed = parseSignatureUR(ur)

    expect(parsed.signature).toMatch(/^0x[0-9a-f]+$/)
    expect(parsed.signature.length).toBe(132)
    expect(parsed.requestIdUuid).toBe(requestId)
    expect(parsed.requestIdHex).toBe(Buffer.from(parseUuid(requestId)).toString('hex'))
    expect(parsed.requestId).toBe(parsed.requestIdHex)
  })

  it('returns empty request id fields when metadata is missing', () => {
    const signature = Buffer.concat([Buffer.alloc(32, 0xaa), Buffer.alloc(32, 0xbb), Buffer.from([0])])
    const ur = encodeSignatureUR(signature)

    const parsed = parseSignatureUR(ur)

    expect(parsed.requestIdHex).toBe('')
    expect(parsed.requestIdUuid).toBe('')
  })

  it('throws on invalid request id metadata length', () => {
    const signature = Buffer.concat([Buffer.alloc(32, 0xaa), Buffer.alloc(32, 0xbb), Buffer.from([0])])
    const ur = encodeSignatureUR(signature, Buffer.from('abcd', 'hex'))

    expect(() => parseSignatureUR(ur)).toThrow('Invalid signature requestId length')
  })
})
