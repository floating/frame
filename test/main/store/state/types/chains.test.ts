import { latest as EthereumChainsSchema } from '../../../../../main/store/state/types/chains'

const validChain = {
  id: 5,
  type: 'ethereum',
  layer: 'testnet',
  isTestnet: true,
  on: false,
  name: 'Görli',
  explorer: 'https://goerli.etherscan.io',
  connection: {
    primary: {
      on: true,
      current: 'pylon',
      status: 'loading',
      connected: false,
      custom: ''
    },
    secondary: {
      on: false,
      current: 'custom',
      status: 'loading',
      connected: false,
      custom: ''
    }
  }
}

it('provides default chains for an empty state', () => {
  const { ethereum: chains } = EthereumChainsSchema.parse(undefined)

  expect(Object.keys(chains)).toEqual(['1', '5', '10', '100', '137', '8453', '42161', '84531', '11155111'])
})

it('handles a corrupted state with the wrong key', () => {
  const { ethereum: chains } = EthereumChainsSchema.parse({ bogus: 'test' })

  expect(Object.keys(chains)).toEqual(['1', '5', '10', '100', '137', '8453', '42161', '84531', '11155111'])
})

it('handles a corrupted state with the wrong structure of the ethereum object', () => {
  const { ethereum: chains } = EthereumChainsSchema.parse({ ethereum: 'test' })

  expect(Object.keys(chains)).toEqual(['1', '5', '10', '100', '137', '8453', '42161', '84531', '11155111'])
})

it('parses a valid chain', () => {
  const { ethereum: chains } = EthereumChainsSchema.parse({ ethereum: { 5: validChain } })

  expect(chains['5']).toEqual(validChain)
})

it('sets the primary connection to disconnected to start', () => {
  const previouslyConnectedChain = {
    ...validChain,
    connection: {
      ...validChain.connection,
      primary: {
        ...validChain.connection.primary,
        connected: true
      }
    }
  }

  const { ethereum: chains } = EthereumChainsSchema.parse({ ethereum: { 5: previouslyConnectedChain } })

  expect(chains['5'].connection.primary.connected).toBe(false)
})

it('sets the secondary connection to disconnected to start', () => {
  const previouslyConnectedChain = {
    ...validChain,
    connection: {
      secondary: {
        ...validChain.connection.secondary,
        connected: true
      }
    }
  }

  const { ethereum: chains } = EthereumChainsSchema.parse({ ethereum: { 5: previouslyConnectedChain } })

  expect(chains['5'].connection.secondary.connected).toBe(false)
})

it('replaces a corrupt chain with a known id with the default value from the state', () => {
  const chain = {
    id: 5,
    test: 'bogusvalue'
  }

  const { ethereum: chains } = EthereumChainsSchema.parse({ ethereum: { 5: chain } })

  expect(chains['5']).toEqual({
    id: 5,
    type: 'ethereum',
    layer: 'testnet',
    isTestnet: true,
    on: false,
    name: 'Görli',
    explorer: 'https://goerli.etherscan.io',
    connection: {
      primary: {
        on: true,
        current: 'custom',
        status: 'loading',
        connected: false,
        custom: ''
      },
      secondary: {
        on: false,
        current: 'custom',
        status: 'loading',
        connected: false,
        custom: ''
      }
    }
  })
})

it('removes an unknown corrupt chain from the state', () => {
  const chain = {
    test: 'bogusvalue'
  }

  const { ethereum: chains } = EthereumChainsSchema.parse({ ethereum: { 15: chain } })

  expect(chains['15']).toBeUndefined()
})

it('adds mainnet if not present in the state', () => {
  const { ethereum: chains } = EthereumChainsSchema.parse({ ethereum: {} })

  expect(chains).toEqual({
    1: {
      id: 1,
      type: 'ethereum',
      layer: 'mainnet',
      name: 'Mainnet',
      isTestnet: false,
      explorer: 'https://etherscan.io',
      on: true,
      connection: {
        primary: {
          on: true,
          current: 'custom',
          status: 'loading',
          connected: false,
          custom: ''
        },
        secondary: {
          on: false,
          current: 'custom',
          status: 'loading',
          connected: false,
          custom: ''
        }
      }
    }
  })
})
