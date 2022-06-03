import { typeSupportsBaseFee, usesBaseFee } from '../../../../resources/domain/transaction'

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
