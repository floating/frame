import {
  buildQRTxPayload,
  computeLegacyRecoveryHash,
  serializeSignedLegacyTransaction
} from '../../../../main/signers/qr/transaction-utils'

describe('qr transaction utils', () => {
  it('builds both legacy sign-data candidates and chooses default eip155 encoding', () => {
    const rawTx = {
      chainId: '0x1',
      type: '0x0',
      nonce: '0x0',
      gasLimit: '0x5208',
      gasPrice: '0x3b9aca00',
      to: '0x000000000000000000000000000000000000dead',
      value: '0x1',
      data: '0x',
      gasFeesSource: 'Frame'
    }

    const payload = buildQRTxPayload(rawTx)

    expect(payload.txType).toBe(0)
    expect(payload.isTypedTransaction).toBe(false)
    expect(payload.chainId).toBe(1)
    expect(payload.cleanTxData.gasPrice).toBe(rawTx.gasPrice)
    expect(payload.txEncodingStrategy).toBe('legacy-unsigned')
    expect(payload.txHashMode).toBe('keccak')
    expect(payload.txHashHint).toMatch(/^0x[0-9a-f]+$/)
    expect(payload.txKeccakHint).toMatch(/^0x[0-9a-f]+$/)
    expect(payload.signData.startsWith('0x')).toBe(true)
    expect(payload.legacyCandidates).toHaveLength(2)
    expect(payload.legacyCandidates[0].encodingId).toBe('legacy-unsigned')
    expect(payload.legacyCandidates[1].encodingId).toBe('legacy-eip155-unsigned')
    expect(payload.legacyCandidates[0].signData).not.toBe(payload.legacyCandidates[1].signData)
  })

  it('uses preferred legacy unsigned encoding when requested', () => {
    const rawTx = {
      chainId: '0xa4b1',
      type: '0x0',
      nonce: '0x3',
      gasLimit: '0x5208',
      gasPrice: '0x17d7840',
      to: '0x000000000000000000000000000000000000dead',
      value: '0x0',
      data: '0x',
      gasFeesSource: 'Frame'
    }

    const payload = buildQRTxPayload(rawTx, {
      preferredLegacyEncoding: 'legacy-unsigned'
    })

    expect(payload.txEncodingStrategy).toBe('legacy-unsigned')
    expect(payload.txHashMode).toBe('keccak')
    expect(payload.signData).toBe(payload.legacyCandidates[0].signData)
  })

  it('uses preferred hash mode when requested and payload supports it', () => {
    const rawTx = {
      chainId: '0x1',
      type: '0x0',
      nonce: '0x0',
      gasLimit: '0x5208',
      gasPrice: '0x3b9aca00',
      to: '0x000000000000000000000000000000000000dead',
      value: '0x1',
      data: '0x',
      gasFeesSource: 'Frame'
    }

    const payload = buildQRTxPayload(rawTx, {
      preferredLegacyHashMode: 'sha256'
    })

    expect(payload.txHashMode).toBe('sha256')
  })

  it('builds sign payloads for eip-1559 transactions', () => {
    const rawTx = {
      chainId: '0xa4b1',
      type: '0x2',
      nonce: '0x3',
      gasLimit: '0x5208',
      maxFeePerGas: '0x17d7840',
      maxPriorityFeePerGas: '0x3b9aca',
      to: '0x000000000000000000000000000000000000dead',
      value: '0x0',
      data: '0x',
      gasFeesSource: 'Frame'
    }

    const payload = buildQRTxPayload(rawTx)

    expect(payload.txType).toBe(2)
    expect(payload.isTypedTransaction).toBe(true)
    expect(payload.chainId).toBe(42161)
    expect(payload.cleanTxData.maxFeePerGas).toBe(rawTx.maxFeePerGas)
    expect(payload.cleanTxData.maxPriorityFeePerGas).toBe(rawTx.maxPriorityFeePerGas)
    expect(payload.txEncodingStrategy).toBe('primary')
    expect(payload.txHashMode).toBe('keccak')
    expect(payload.txHashHint).toMatch(/^0x[0-9a-f]+$/)
    expect(payload.txKeccakHint).toMatch(/^0x[0-9a-f]+$/)
    expect(payload.signData.startsWith('0x')).toBe(true)
    expect(payload.legacyCandidates).toBeUndefined()
  })

  it('serializes signed legacy transactions deterministically', () => {
    const cleanTxData = {
      chainId: '0x1',
      type: '0x0',
      nonce: '0x0',
      gasLimit: '0x5208',
      gasPrice: '0x3b9aca00',
      to: '0x000000000000000000000000000000000000dead',
      value: '0x1',
      data: '0x',
      gasFeesSource: 'Frame'
    }

    const serialized = serializeSignedLegacyTransaction(cleanTxData, {
      v: '1c',
      r: '1'.padStart(64, '0'),
      s: '2'.padStart(64, '0')
    })

    expect(serialized).toMatch(/^0x[0-9a-f]+$/)
    expect(serialized.length).toBeGreaterThan(60)
  })

  it('computes recovery hash for keccak and sha256 modes', () => {
    const bytes = Buffer.from('abcd', 'hex')
    const keccakHash = computeLegacyRecoveryHash(bytes, 'keccak')
    const shaHash = computeLegacyRecoveryHash(bytes, 'sha256')

    expect(keccakHash.length).toBe(32)
    expect(shaHash.length).toBe(32)
    expect(keccakHash.equals(shaHash)).toBe(false)
  })

  it('rejects identity32 mode for non-32-byte payloads', () => {
    const bytes = Buffer.from('abcd', 'hex')
    expect(() => computeLegacyRecoveryHash(bytes, 'identity32')).toThrow('identity32 hash mode')
  })
})
