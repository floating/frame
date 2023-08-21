import migration from '../../../../../main/store/migrate/migrations/40'
import { createState } from '../setup'

let state

beforeEach(() => {
  state = createState(migration.version - 1)

  state.main.tokens = {
    known: {},
    custom: []
  }
})

it('should have migration version 40', () => {
  const { version } = migration
  expect(version).toBe(40)
})

describe('custom tokens', () => {
  it('should transform tokens with a logo URI', () => {
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

    expect(migratedState.main.tokens.custom).toStrictEqual([
      {
        ...restOfToken,
        media: {
          source,
          format: 'image',
          cdn: {}
        },
        hideByDefault: false
      }
    ])
  })

  it('should transform tokens without a logo URI', () => {
    const customToken = {
      name: 'Custom Token',
      symbol: 'CT',
      chainId: 1,
      address: '0x1234',
      decimals: 18
    }

    state.main.tokens.custom.push(customToken)
    const migratedState = migration.migrate(state)

    expect(migratedState.main.tokens.custom).toStrictEqual([
      {
        ...customToken,
        media: {
          source: '',
          format: 'image',
          cdn: {}
        },
        hideByDefault: false
      }
    ])
  })
})

describe('known tokens', () => {
  it('should transform tokens with a logo URI', () => {
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
        },
        hideByDefault: false
      }
    ])
  })

  it('should transform tokens without a logo URI', () => {
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
        },
        hideByDefault: false
      }
    ])
  })
})
