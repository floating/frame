import migration from '../../../../../main/store/migrate/migrations/39'
import { createState } from '../setup'

let state

beforeEach(() => {
  state = createState(migration.version - 1)

  state.main.tokens = {
    known: {},
    custom: []
  }
})

it('should have migration version 39', () => {
  const { version } = migration
  expect(version).toBe(39)
})

it('should default to a safe state if the tokens is fatally corrupted', () => {
  state.main.tokens = []
  const migratedState = migration.migrate(state)

  expect(migratedState.main.tokens).toStrictEqual({
    known: {},
    custom: []
  })
})

it('should default to a safe state if the tokens is undefined', () => {
  state.main.tokens = undefined
  const migratedState = migration.migrate(state)

  expect(migratedState.main.tokens).toStrictEqual({
    known: {},
    custom: []
  })
})

describe('custom tokens', () => {
  it('should default the tokens to a safe state if they are undefined', () => {
    state.main.tokens.custom = undefined
    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.custom).toStrictEqual([])
  })

  it('should default the tokens to a safe state if they are fatally corrupted', () => {
    state.main.tokens.custom = {}
    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.custom).toStrictEqual([])
  })

  it('should transform tokens with a logoUri correctly', () => {
    const customToken = {
      name: 'Custom Token',
      symbol: 'CT',
      chainId: 1,
      address: '0x1234',
      decimals: 18,
      logoURI: 'https://example.com/logo.png'
    }

    state.main.tokens.custom.push(customToken)
    const migratedState = migration.migrate(state)

    const { logoURI: source, ...restOfToken } = customToken

    delete customToken.logoURI
    expect(migratedState.main.tokens.custom[0]).toStrictEqual({
      ...restOfToken,
      media: {
        source,
        format: 'image',
        cdn: {}
      }
    })
  })

  it('should transform tokens without a logoUri correctly', () => {
    const customToken = {
      name: 'Custom Token',
      symbol: 'CT',
      chainId: 1,
      address: '0x1234',
      decimals: 18
    }

    state.main.tokens.custom.push(customToken)
    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.custom[0]).toStrictEqual({
      ...customToken,
      media: {
        source: '',
        format: 'image',
        cdn: {}
      }
    })
  })

  it('should repair tokens with corrupted names', () => {
    const customToken = {
      nome: 'Custom Token',
      symbol: 'CT',
      chainId: 1,
      address: '1234',
      decimals: 18
    }

    state.main.tokens.custom.push(customToken)
    const migratedState = migration.migrate(state)

    const { nome, ...restOfToken } = customToken

    expect(migratedState.main.tokens.custom[0]).toStrictEqual({
      ...restOfToken,
      name: '',
      media: {
        source: '',
        format: 'image',
        cdn: {}
      }
    })
  })

  it('should repair tokens with corrupted symbols', () => {
    const customToken = {
      name: 'custom token',
      chainId: 1,
      address: '1234',
      decimals: 18
    }

    state.main.tokens.custom.push(customToken)
    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.custom[0]).toStrictEqual({
      ...customToken,
      symbol: '',
      media: {
        source: '',
        format: 'image',
        cdn: {}
      }
    })
  })

  it('should remove tokens with fatally corrupted schemas', () => {
    const customToken = {
      name: 'Custom Token',
      symbol: 'CT',
      address: '0x1234',
      decimals: 18
    }

    state.main.tokens.custom.push(customToken)
    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.custom).toStrictEqual([])
  })

  it('should transform all correctly shaped tokens', () => {
    const corruptedToken = {
      name: 'Custom Token',
      symbol: 'CT',
      chainId: 1,
      address: '0x1234'
    }

    const validToken = {
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      name: 'Test Token',
      symbol: 'TT',
      decimals: 18
    }

    state.main.tokens.custom.push(corruptedToken, validToken)

    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.custom).toStrictEqual([
      {
        ...validToken,
        media: {
          source: '',
          format: 'image',
          cdn: {}
        }
      }
    ])
  })
})

describe('known tokens', () => {
  it('should default the tokens to a safe state if they are undefined', () => {
    state.main.tokens.known = undefined
    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.known).toStrictEqual({})
  })

  it('should default the tokens to a safe state if they are fatally corrupted', () => {
    state.main.tokens.known = []
    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.known).toStrictEqual({})
  })

  it('should transform tokens with a logoUri correctly', () => {
    const knownToken = {
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      name: 'Test Token',
      symbol: 'TT',
      decimals: 18,
      logoURI: 'https://example.com/logo.png',
      balance: '0x123',
      displayBalance: '123'
    }

    state.main.tokens.known['0x123'] = [knownToken]
    const migratedState = migration.migrate(state)

    const { logoURI: source, ...restOfToken } = knownToken

    expect(migratedState.main.tokens.known['0x123']).toStrictEqual([
      {
        ...restOfToken,
        media: {
          source,
          format: 'image',
          cdn: {}
        }
      }
    ])
  })

  it('should transform tokens without a logoUri correctly', () => {
    const knownToken = {
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      name: 'Test Token',
      symbol: 'TT',
      decimals: 18,
      balance: '0x123',
      displayBalance: '123'
    }

    state.main.tokens.known['0x123'] = [knownToken]
    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.known['0x123']).toStrictEqual([
      {
        ...knownToken,
        media: {
          source: '',
          format: 'image',
          cdn: {}
        }
      }
    ])
  })

  it('should remove all tokens with corrupted schemas', () => {
    const knownToken = {
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      name: 'Test Token',
      symbol: 'TT',
      balance: '0x123',
      displayBalance: '123'
    }

    state.main.tokens.known['0x123'] = [knownToken]
    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.known['0x123']).toStrictEqual([])
  })

  it('should transform all correctly shaped tokens', () => {
    const corruptedKnownToken = {
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      name: 'Test Token',
      symbol: 'TT',
      decimal: 18,
      balance: '0x123',
      displayBalance: '123'
    }

    const validKnownToken = {
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      name: 'Test Token 2',
      symbol: 'TT2',
      decimals: 18,
      balance: '0x123',
      displayBalance: '123'
    }

    state.main.tokens.known['0x123'] = [corruptedKnownToken, validKnownToken]

    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.known['0x123']).toStrictEqual([
      {
        ...validKnownToken,
        media: {
          source: '',
          format: 'image',
          cdn: {}
        }
      }
    ])
  })

  it('should repair tokens with corrupted names', () => {
    const knownToken = {
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      symbol: 'TT2',
      decimals: 18,
      balance: '0x123',
      displayBalance: '123'
    }

    state.main.tokens.known['0x123'] = [knownToken]
    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.known['0x123'][0]).toStrictEqual({
      ...knownToken,
      name: '',
      media: {
        source: '',
        format: 'image',
        cdn: {}
      }
    })
  })

  it('should repair tokens with corrupted symbols', () => {
    const knownToken = {
      chainId: 1,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      name: 'custom 2',
      symbole: 'TT2',
      decimals: 18,
      balance: '0x123',
      displayBalance: '123'
    }

    state.main.tokens.known['0x123'] = [knownToken]
    const migratedState = migration.migrate(state)

    const { symbole, ...restOfToken } = knownToken
    expect(migratedState.main.tokens.known['0x123'][0]).toStrictEqual({
      ...restOfToken,
      symbol: '',
      media: {
        source: '',
        format: 'image',
        cdn: {}
      }
    })
  })
})
