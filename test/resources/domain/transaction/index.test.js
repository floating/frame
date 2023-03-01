import { normalizeChainId, typeSupportsBaseFee, usesBaseFee } from '../../../../resources/domain/transaction'

describe('#typeSupportsBaseFee', () => {
  it('does not support a base fee for type 0', () => {
    expect(typeSupportsBaseFee('0x0')).toBe(false)
  })

  it('does not support a base fee for type 1', () => {
    expect(typeSupportsBaseFee('0x1')).toBe(false)
  })

  it('supports a base fee for type 2', () => {
    expect(typeSupportsBaseFee('0x2')).toBe(true)
  })
})

describe('#usesBaseFee', () => {
  it('does not use a base fee for transaction type 0', () => {
    const tx = {
      type: '0x0'
    }

    expect(usesBaseFee(tx)).toBe(false)
  })

  it('does not use a base fee for transaction type 1', () => {
    const tx = {
      type: '0x1'
    }

    expect(usesBaseFee(tx)).toBe(false)
  })

  it('uses a base fee for transaction type 2', () => {
    const tx = {
      type: '0x2'
    }

    expect(usesBaseFee(tx)).toBe(true)
  })
})

describe('#normalizeChainId', () => {
  it('does not modify a transaction with no chain id', () => {
    const tx = { to: '0xframe' }

    expect(normalizeChainId(tx)).toStrictEqual(tx)
  })

  it('normalizes a hex-prefixed chain id', () => {
    const tx = { to: '0xframe', chainId: '0xa' }

    expect(normalizeChainId(tx)).toStrictEqual({ to: '0xframe', chainId: '0xa' })
  })

  it('does not handle a hex chain id with no prefix', () => {
    const tx = { to: '0xframe', chainId: 'a' }

    expect(() => normalizeChainId(tx)).toThrowError(/chain for transaction.*is not a hex-prefixed string/i)
  })

  it('normalizes a numeric chain id', () => {
    const tx = { to: '0xframe', chainId: 14 }

    expect(normalizeChainId(tx)).toStrictEqual({ to: '0xframe', chainId: '0xe' })
  })

  it('normalizes a numeric string chain id', () => {
    const tx = { to: '0xframe', chainId: '100' }

    expect(normalizeChainId(tx)).toStrictEqual({ to: '0xframe', chainId: '0x64' })
  })

  it('does not allow a chain id that does not match the target chain', () => {
    const tx = { to: '0xframe', chainId: '0xa' }

    expect(() => normalizeChainId(tx, 11)).toThrowError(
      /chain for transaction.*does not match request target chain/i
    )
  })
})
