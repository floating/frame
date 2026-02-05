import QRSignerAdapter from '../../../../main/signers/qr/adapter'
import { QRSignError } from '../../../../main/signers/qr/errors'
import store from '../../../../main/store'

jest.mock('../../../../main/store', () => {
  const mockedStore = jest.fn((...path) => {
    if (path.join('.') === 'main.qr.signRequest') {
      return { signerId: 'signer-1' }
    }
    return {}
  })

  mockedStore.observer = jest.fn(() => ({ remove: jest.fn() }))
  mockedStore.clearQRSignRequest = jest.fn()
  mockedStore.setQRDevices = jest.fn()
  mockedStore.setQRSignRequest = jest.fn()
  mockedStore.setQRVerifyAddress = jest.fn()

  return mockedStore
})

function buildAdapterWithPendingRequest() {
  const adapter = new QRSignerAdapter()
  const signer = {
    profileId: 'profile-1',
    hasPendingSignRequest: jest.fn(() => true),
    submitSignature: jest.fn(() => Promise.resolve({})),
    cancelSignRequest: jest.fn(),
    getPreferredLegacyEncoding: jest.fn(() => 'legacy-eip155-unsigned'),
    getPreferredLegacyHashMode: jest.fn(() => 'keccak'),
    setPreferredLegacyEncoding: jest.fn(),
    setPreferredLegacyHashMode: jest.fn(),
    getDeviceData: jest.fn(() => ({
      profileId: 'profile-1',
      masterFingerprint: '1234abcd',
      xpub: 'xpub',
      derivationPath: "m/44'/60'/0'",
      preferredLegacyEncoding: 'legacy-eip155-unsigned',
      preferredLegacyHashMode: 'sha256',
      name: 'QR Wallet'
    })),
    close: jest.fn()
  }

  adapter.knownSigners = { 'signer-1': signer }
  adapter.pendingSignRequests = {
    'signer-1': {
      requestId: 'f58f27db-79f8-4ecd-bfd1-dfcd7008b33f',
      type: 'transaction',
      index: 0,
      expectedAddress: '0x0000000000000000000000000000000000000001',
      resolvedDerivationPath: "m/44'/60'/0'/0/0",
      createdAt: Date.now(),
      txEncodingStrategy: 'legacy-eip155-unsigned',
      txHashMode: 'keccak',
      txHashHint: '0xabc',
      txKeccakHint: '0xdef',
      txMeta: {
        chainId: 1,
        txType: 0,
        txEncodingStrategy: 'legacy-eip155-unsigned',
        txHashMode: 'keccak',
        txHashHint: '0xabc',
        txKeccakHint: '0xdef'
      }
    }
  }

  return { adapter, signer }
}

describe('qr adapter signature submission', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects signatures without request id metadata', async () => {
    const { adapter, signer } = buildAdapterWithPendingRequest()

    await expect(adapter.submitSignature('signer-1', '0xabc')).rejects.toThrow(
      'Scanned signature is missing requestId metadata'
    )
    expect(signer.submitSignature).not.toHaveBeenCalled()
  })

  it('rejects signatures with mismatched request ids', async () => {
    const { adapter, signer } = buildAdapterWithPendingRequest()

    await expect(
      adapter.submitSignature('signer-1', '0xabc', '9d9ded4c-36ea-4fd4-b55f-cfb572b8f7cf')
    ).rejects.toThrow('Signature requestId mismatch')
    expect(signer.submitSignature).not.toHaveBeenCalled()
  })

  it('clears the qr store request on successful submission', async () => {
    const { adapter, signer } = buildAdapterWithPendingRequest()

    await adapter.submitSignature('signer-1', '0xabc', 'f58f27db-79f8-4ecd-bfd1-dfcd7008b33f')

    expect(signer.submitSignature).toHaveBeenCalledTimes(1)
    expect(signer.submitSignature).toHaveBeenCalledWith('0xabc', {
      txEncodingStrategy: 'legacy-eip155-unsigned',
      txHashMode: 'keccak'
    })
    expect(store.clearQRSignRequest).toHaveBeenCalledTimes(1)
    expect(adapter.pendingSignRequests['signer-1']).toBeUndefined()
  })

  it('persists preferred legacy encoding when signer reports compatibility fallback', async () => {
    const { adapter, signer } = buildAdapterWithPendingRequest()
    signer.submitSignature.mockResolvedValueOnce({
      selectedLegacyEncoding: 'legacy-unsigned',
      selectedHashMode: 'sha256'
    })

    await adapter.submitSignature('signer-1', '0xabc', 'f58f27db-79f8-4ecd-bfd1-dfcd7008b33f')

    expect(signer.setPreferredLegacyEncoding).toHaveBeenCalledWith('legacy-unsigned')
    expect(signer.setPreferredLegacyHashMode).toHaveBeenCalledWith('sha256')
    expect(store.setQRDevices).toHaveBeenCalledTimes(1)
  })

  it('keeps request context on recoverable signer failures', async () => {
    const { adapter, signer } = buildAdapterWithPendingRequest()

    signer.submitSignature.mockRejectedValueOnce(
      new QRSignError('Address mismatch', 'QR_SIGNATURE_ADDRESS_MISMATCH', true)
    )

    await expect(
      adapter.submitSignature('signer-1', '0xabc', 'f58f27db-79f8-4ecd-bfd1-dfcd7008b33f')
    ).rejects.toThrow('Address mismatch')

    expect(store.clearQRSignRequest).not.toHaveBeenCalled()
    expect(adapter.pendingSignRequests['signer-1']).toBeDefined()
  })
})
