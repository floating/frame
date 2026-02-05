import { addHexPrefix, ecsign, privateToAddress } from '@ethereumjs/util'

import QRSigner from '../../../../main/signers/qr/QRSigner'
import { buildQRTxPayload, computeLegacyRecoveryHash } from '../../../../main/signers/qr/transaction-utils'

function buildSigner() {
  return new QRSigner({
    profileId: 'profile',
    masterFingerprint: '1234abcd',
    xpub: 'xpub661MyMwAqRbcF9z4sN3YQh6UBYvA4Y4Yf3xV7uqhNq6yYf6Q4aSYuGmL8i8QxA',
    derivationPath: "m/44'/60'/0'",
    name: 'Test QR'
  })
}

function buildRawTx() {
  return {
    chainId: '0xa4b1',
    type: '0x0',
    nonce: '0x23',
    gasLimit: '0x4c2444',
    gasPrice: '0x17d7840',
    to: '0x000000000000000000000000000000000000dead',
    value: '0x0',
    data: '0x',
    gasFeesSource: 'Frame'
  }
}

function addressFromPrivateKey(privateKeyHex) {
  const privateKey = Buffer.from(privateKeyHex.replace(/^0x/, ''), 'hex')
  return addHexPrefix(privateToAddress(privateKey).toString('hex'))
}

function signLegacyCandidate(candidate, privateKeyHex, hashMode = 'keccak') {
  const privateKey = Buffer.from(privateKeyHex.replace(/^0x/, ''), 'hex')
  const hash = computeLegacyRecoveryHash(candidate.signDataBytes, hashMode)
  const { r, s, v } = ecsign(hash, privateKey)
  const recoveryId = Number(v - 27n)

  return `0x${r.toString('hex')}${s.toString('hex')}${recoveryId.toString(16).padStart(2, '0')}`
}

describe('QRSigner legacy signature compatibility', () => {
  it('accepts fallback when signature matches legacy unsigned encoding', async () => {
    const signer = buildSigner()
    const callback = jest.fn()
    const rawTx = buildRawTx()
    const payload = buildQRTxPayload(rawTx)
    const legacyUnsignedCandidate = payload.legacyCandidates.find(
      (candidate) => candidate.encodingId === 'legacy-unsigned'
    )
    expect(legacyUnsignedCandidate).toBeDefined()
    const privateKey = '0x59c6995e998f97a5a004497e5daef286fdb74f3f6f20f07a5f8f2b2d6f5f6f9a'
    const expectedAddress = addressFromPrivateKey(privateKey)

    signer.pendingSignRequest = {
      type: 'transaction',
      index: 0,
      data: {
        rawTx,
        address: expectedAddress
      },
      callback,
      txPayloadSnapshot: payload
    }

    const signature = signLegacyCandidate(legacyUnsignedCandidate, privateKey)
    const result = await signer.submitSignature(signature, {
      txEncodingStrategy: 'legacy-eip155-unsigned'
    })

    expect(result).toEqual({ selectedLegacyEncoding: 'legacy-unsigned', selectedHashMode: 'keccak' })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0]).toBeNull()
    expect(callback.mock.calls[0][1]).toMatch(/^0x[0-9a-f]+$/)
    expect(signer.pendingSignRequest).toBeNull()
  })

  it('accepts sha256 hash-mode fallback for legacy signatures', async () => {
    const signer = buildSigner()
    const callback = jest.fn()
    const rawTx = buildRawTx()
    const payload = buildQRTxPayload(rawTx)
    const legacyCandidate = payload.legacyCandidates[0]
    const privateKey = '0x59c6995e998f97a5a004497e5daef286fdb74f3f6f20f07a5f8f2b2d6f5f6f9a'
    const expectedAddress = addressFromPrivateKey(privateKey)

    signer.pendingSignRequest = {
      type: 'transaction',
      index: 0,
      data: {
        rawTx,
        address: expectedAddress
      },
      callback,
      txPayloadSnapshot: payload
    }

    const signature = signLegacyCandidate(legacyCandidate, privateKey, 'sha256')
    const result = await signer.submitSignature(signature, {
      txEncodingStrategy: 'legacy-eip155-unsigned'
    })

    expect(result).toEqual({
      selectedLegacyEncoding: 'legacy-eip155-unsigned',
      selectedHashMode: 'sha256'
    })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('keeps pending request on recoverable mismatch after all strategies', async () => {
    const signer = buildSigner()
    const callback = jest.fn()
    const rawTx = buildRawTx()
    const payload = buildQRTxPayload(rawTx)
    const privateKeyUsedForSignature = '0x8b3a350cf5c34c9194ca3a545d0f7f85f6a7a9f0f22d0d8f2f9f14f2c8a4fe5b'
    const expectedAddress = addressFromPrivateKey(
      '0x59c6995e998f97a5a004497e5daef286fdb74f3f6f20f07a5f8f2b2d6f5f6f9a'
    )

    signer.pendingSignRequest = {
      type: 'transaction',
      index: 0,
      data: {
        rawTx,
        address: expectedAddress
      },
      callback,
      txPayloadSnapshot: payload
    }

    const signature = signLegacyCandidate(payload.legacyCandidates[0], privateKeyUsedForSignature)

    await expect(signer.submitSignature(signature)).rejects.toThrow('Signature verification failed')
    expect(callback).not.toHaveBeenCalled()
    expect(signer.pendingSignRequest).not.toBeNull()
  })
})
