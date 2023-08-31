import { latest as TokensSchema } from '../../../../../main/store/state/types/tokens'

const validToken = {
  chainId: 137,
  address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326',
  name: 'My test token',
  symbol: 'MTT',
  decimals: 18,
  hideByDefault: false,
  media: {
    source: 'https://example.com/logo.png',
    format: 'image',
    cdn: {
      main: 'https://ourcdn.com/logo.png',
      thumb: 'https://ourcdn.com/thumb/logo.png',
      frozen: 'https://ourcdn.com/frozen/logo.png'
    }
  }
}

describe('known tokens', () => {
  const validKnownToken = {
    ...validToken,
    balance: '0x1feb3dd067660000',
    displayBalance: '2.3'
  }

  it('defaults to an empty object for an empty state', () => {
    expect(TokensSchema.parse(undefined).known).toStrictEqual({})
  })

  it('defaults to an empty object for a corrupt state', () => {
    expect(TokensSchema.parse([]).known).toStrictEqual({})
  })

  it('parses a valid known token', () => {
    const tokens = { known: { '0xtoken': [validKnownToken] }, custom: [] }
    expect(TokensSchema.parse(tokens).known).toStrictEqual(tokens.known)
  })

  it('removes an invalid known token from the list of known tokens for an address', () => {
    const invalidKnownToken = {
      ...validKnownToken,
      chainId: 'bogus'
    }

    const tokens = { known: { '0xaddress': [validKnownToken, invalidKnownToken] }, custom: [] }
    expect(TokensSchema.parse(tokens).known).toStrictEqual({ '0xaddress': [validKnownToken] })
  })

  it('removes the only known token from the known tokens for an address', () => {
    const invalidKnownToken = {
      ...validKnownToken,
      chainId: 'bogus'
    }

    const tokens = {
      known: { '0xaddress1': [validKnownToken], '0xaddress2': [invalidKnownToken] },
      custom: []
    }

    expect(TokensSchema.parse(tokens).known).toStrictEqual({
      '0xaddress1': [validKnownToken],
      '0xaddress2': []
    })
  })
})

describe('custom tokens', () => {
  it('defaults to an empty object for an empty state', () => {
    expect(TokensSchema.parse(undefined).custom).toStrictEqual([])
  })

  it('defaults to an empty object for a corrupt state', () => {
    expect(TokensSchema.parse([]).custom).toStrictEqual([])
  })

  it('parses a valid custom token', () => {
    const tokens = { known: {}, custom: [validToken] }
    expect(TokensSchema.parse(tokens).custom).toStrictEqual([validToken])
  })

  it('removes an invalid custom token', () => {
    const invalidToken = {
      ...validToken,
      chainId: 'bogus'
    }

    const tokens = { known: {}, custom: [validToken, invalidToken] }
    expect(TokensSchema.parse(tokens).custom).toStrictEqual([validToken])
  })
})
