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

it('should transform outdated known tokens with a logoUri correctly', () => {
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

it('should transform outdated known tokens without a logoUri correctly', () => {
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

it('should transform outdated custom tokens with a logoUri correctly', () => {
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

it('should transform outdated custom tokens without a logoUri correctly', () => {
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

it('should pass through custom tokens with corrupted schemas', () => {
  const customToken = {
    name: 'Custom Token',
    symabol: 'CT',
    chainId: 1,
    address: '0x1234',
    decimals: 18
  }

  state.main.tokens.custom.push(customToken)
  const migratedState = migration.migrate(state)

  expect(migratedState.main.tokens.custom[0]).toStrictEqual(customToken)
})

it('should pass through known tokens with corrupted schemas', () => {
  const knownToken = {
    chainId: 1,
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    name: 'Test Token',
    symbol: 'TT',
    decimal: 18,
    balance: '0x123',
    displayBalance: '123'
  }

  state.main.tokens.known['0x123'] = [knownToken]
  const migratedState = migration.migrate(state)

  expect(migratedState.main.tokens.known['0x123']).toStrictEqual([knownToken])
})
