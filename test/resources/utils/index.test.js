import { matchFilter, getAddress } from '../../../resources/utils'

describe('matchFilter', () => {
  it('passes single filter match of properties', () => {
    const filter = 'one'
    const properties = ['one', 'b', 'c', 'd']
    const matched = matchFilter(filter, properties)
    expect(matched).toStrictEqual(true)
  })

  it('fails single filter match of properties', () => {
    const filter = 'one'
    const properties = ['a', 'b', 'c', 'd']
    const matched = matchFilter(filter, properties)
    expect(matched).toStrictEqual(false)
  })

  it('passes multi-part filter match of properties', () => {
    const filter = 'one two'
    const properties = ['one', 'two', 'c', 'd']
    const matched = matchFilter(filter, properties)
    expect(matched).toStrictEqual(true)
  })

  it('fails multi-part filter match of properties', () => {
    const filter = 'one two'
    const properties = ['a', 'b', 'c', 'd']
    const matched = matchFilter(filter, properties)
    expect(matched).toStrictEqual(false)
  })

  it('fails multi-part filter partial match of properties', () => {
    const filter = 'one two'
    const properties = ['one', 'b', 'c', 'd']
    const matched = matchFilter(filter, properties)
    expect(matched).toStrictEqual(false)
  })

  it('passes multi-part filter match to multi-part propery', () => {
    const filter = 'one two'
    const properties = ['one two', 'a', 'b']
    const matched = matchFilter(filter, properties)
    expect(matched).toStrictEqual(true)
  })

  it('passes multi-part filter match to multiple multi-part properties', () => {
    const filter = 'one two three'
    const properties = ['zero one', 'two', 'three four five']
    const matched = matchFilter(filter, properties)
    expect(matched).toStrictEqual(true)
  })

  it('passes when filter is undefined', () => {
    const filter = undefined
    const properties = ['zero one', 'two', 'three four five']
    const matched = matchFilter(filter, properties)
    expect(matched).toStrictEqual(true)
  })

  it('fails when properties is undefined', () => {
    const filter = 'one'
    const properties = undefined
    const matched = matchFilter(filter, properties)
    expect(matched).toStrictEqual(false)
  })

  it('fails when properties is not an array', () => {
    const filter = 'one'
    const properties = 'hello'
    const matched = matchFilter(filter, properties)
    expect(matched).toStrictEqual(false)
  })

  it('fails when filter is not a string', () => {
    const filter = ['one']
    const properties = ['one']
    const matched = matchFilter(filter, properties)
    expect(matched).toStrictEqual(false)
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
