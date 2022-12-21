import { matchFilter, getAddress } from '../../../resources/utils'

describe('#matchFilter', () => {
  it('matches if the entire filter matches a single property', () => {
    const filter = 'one two'
    const properties = ['one two', 'a', 'b']
    const matched = matchFilter(filter, properties)
    expect(matched).toBe(true)
  })

  it('splits the filter and matches if every individual string matches any property', () => {
    const filter = 'one two'
    const properties = ['one', 'two', 'c', 'd']
    const matched = matchFilter(filter, properties)
    expect(matched).toBe(true)
  })

  it('splits the filter and does not match if only one string matches', () => {
    const filter = 'one two'
    const properties = ['one', 'b', 'c', 'd']
    const matched = matchFilter(filter, properties)
    expect(matched).toBe(false)
  })

  it('splits the filter and matches if every individual string partially matches any property', () => {
    const filter = 'one two three'
    const properties = ['zero one', 'two', 'three four five']
    const matched = matchFilter(filter, properties)
    expect(matched).toBe(true)
  })

  it('does not match when no properties match the filter', () => {
    const filter = 'one'
    const properties = ['a', 'b', 'c', 'd']
    const matched = matchFilter(filter, properties)
    expect(matched).toBe(false)
  })

  it('matches when the filter is an empty string', () => {
    const filter = ''
    const properties = ['zero one', 'two', 'three four five']
    const matched = matchFilter(filter, properties)
    expect(matched).toBe(true)
  })

  it('matches when the filter is falsy', () => {
    const filter = undefined
    const properties = ['zero one', 'two', 'three four five']
    const matched = matchFilter(filter, properties)
    expect(matched).toBe(true)
  })

  it('does not match on falsy properties', () => {
    const filter = 'zero'
    const properties = [undefined]
    const matched = matchFilter(filter, properties)
    expect(matched).toBe(false)
  })

  it('matches when some properties are falsy', () => {
    const filter = 'zero'
    const properties = [undefined, 'zeroth']
    const matched = matchFilter(filter, properties)
    expect(matched).toBe(true)
  })
})

describe('#getAddress', () => {
  it('returns a checksummed address', () => {
    expect(getAddress('0x81aa3e376ea6e4b238a213324220c1a515031d12')).toBe(
      '0x81aA3e376ea6e4b238a213324220c1A515031D12'
    )
  })

  it('corrects an incorrectly checksummed address', () => {
    expect(getAddress('0x81aa3e376ea6e4b238a213324220C1a515031D12')).toBe(
      '0x81aA3e376ea6e4b238a213324220c1A515031D12'
    )
  })
})
