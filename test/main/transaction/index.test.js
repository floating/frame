import { signerCompatibility } from '../../../main/transaction'

describe('#signerCompatibility', () => {
  it('is always compatible with legacy transactions', () => {
    const tx = {
      type: '0x0'
    }

    const compatibility = signerCompatibility(tx, { type: 'anysigner' })

    expect(compatibility.signer).toBe('anysigner')
    expect(compatibility.tx).toBe('legacy')
    expect(compatibility.compatible).toBe(true)
  })

  it('is always compatible with eip-1559 transactions for seed signers', () => {
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'seed' })

    expect(compatibility.signer).toBe('seed')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is always compatible with eip-1559 transactions for ring signers', () => {
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'ring' })

    expect(compatibility.signer).toBe('ring')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is not compatible for eip-1559 transactions on Ledger signers using eth app prior to 1.9.x', () => {
    const appVersion = { major: 1, minor: 7, patch: 4 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'ledger', appVersion })

    expect(compatibility.signer).toBe('ledger')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(false)
  })

  it('is compatible for eip-1559 transactions on Ledger signers using eth app 1.9.x', () => {
    const appVersion = { major: 1, minor: 9, patch: 0 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'ledger', appVersion })

    expect(compatibility.signer).toBe('ledger')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is compatible for eip-1559 transactions on Ledger signers using eth app 2.x', () => {
    const appVersion = { major: 2, minor: 1, patch: 3 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'ledger', appVersion })

    expect(compatibility.signer).toBe('ledger')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is not compatible for eip-1559 transactions on Lattice signers using firmware prior to 0.11.x', () => {
    const appVersion = { major: 0, minor: 10, patch: 0 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'lattice', appVersion })

    expect(compatibility.signer).toBe('lattice')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(false)
  })

  it('is compatible for eip-1559 transactions on Lattice signers using firmware 0.11.x', () => {
    const appVersion = { major: 0, minor: 11, patch: 2 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'lattice', appVersion })

    expect(compatibility.signer).toBe('lattice')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })

  it('is compatible for eip-1559 transactions on Lattice signers using firmware 1.x', () => {
    const appVersion = { major: 1, minor: 0, patch: 2 }
    const tx = {
      type: '0x2'
    }

    const compatibility = signerCompatibility(tx, { type: 'lattice', appVersion })

    expect(compatibility.signer).toBe('lattice')
    expect(compatibility.tx).toBe('london')
    expect(compatibility.compatible).toBe(true)
  })
})