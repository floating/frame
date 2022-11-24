import { typeSupportsBaseFee, usesBaseFee } from '../../../../resources/domain/transaction'
import { getAddress } from '../../../../resources/utils'

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

describe('#getAddress', () => {
  it('returns a checksummed address', () => {
    expect(getAddress('0x81aa3e376ea6e4b238a213324220c1a515031d12')).toBe('0x81aA3e376ea6e4b238a213324220c1A515031D12')
  })

  it('corrects an incorrectly checksummed address', () => {
    expect(getAddress('0x81aa3e376ea6e4b238a213324220C1a515031D12')).toBe('0x81aA3e376ea6e4b238a213324220c1A515031D12')
  })
})
