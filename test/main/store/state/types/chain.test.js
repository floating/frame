import { EthereumChainsSchema } from '../../../../../main/store/state/types/chain'

const validChain = {
  id: 11155111,
  type: 'ethereum',
  layer: 'testnet',
  isTestnet: true,
  on: false,
  name: 'Sepolia',
  explorer: 'https://sepolia.etherscan.io',
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

it('parses a valid chain', () => {
  const { ethereum: chains } = EthereumChainsSchema.parse({ ethereum: { 11155111: validChain } })

  expect(chains['11155111']).toEqual(validChain)
})

it('sets the primary connection to disconnected to start', () => {
  const previouslyConnectedChain = {
    ...validChain,
    connection: {
      primary: {
        ...validChain.connection.primary,
        connected: true
      }
    }
  }

  const { ethereum: chains } = EthereumChainsSchema.parse({
    ethereum: { 11155111: previouslyConnectedChain }
  })

  expect(chains['11155111'].connection.primary.connected).toBe(false)
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

  const { ethereum: chains } = EthereumChainsSchema.parse({
    ethereum: { 11155111: previouslyConnectedChain }
  })

  expect(chains['11155111'].connection.secondary.connected).toBe(false)
})

it('replaces a corrupt chain with a known id with the default value from the state', () => {
  const chain = {
    id: 11155111,
    test: 'bogusvalue'
  }

  const { ethereum: chains } = EthereumChainsSchema.parse({ ethereum: { 11155111: chain } })

  expect(chains['11155111']).toEqual({
    id: 11155111,
    type: 'ethereum',
    layer: 'testnet',
    isTestnet: true,
    on: false,
    name: 'Sepolia',
    explorer: 'https://sepolia.etherscan.io',
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

  const { ethereum: chains } = EthereumChainsSchema.parse({ ethereum: { 11155111: chain } })

  expect(chains['11155111']).toBeUndefined()
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
