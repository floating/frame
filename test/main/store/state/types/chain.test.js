import { EthereumChainsSchema } from '../../../../../main/store/state/types/chain'

it('parses a valid chain', () => {
  const chain = {
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

  const chains = EthereumChainsSchema.parse({ 5: chain })

  expect(chains['5']).toEqual(chain)
})

it('replaces a corrupt chain with a known id with the default value from the state', () => {
  const chain = {
    id: 5,
    test: 'bogusvalue'
  }

  const chains = EthereumChainsSchema.parse({ 5: chain })

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
        current: 'pylon',
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        custom: ''
      },
      secondary: {
        on: false,
        current: 'custom',
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        custom: ''
      }
    }
  })
})

it('removes an unknown corrupt chain from the state', () => {
  const chain = {
    test: 'bogusvalue'
  }

  const chains = EthereumChainsSchema.parse({ 5: chain })

  expect(chains['5']).toBeUndefined()
})

it('adds mainnet if not present in the state', () => {
  const chains = EthereumChainsSchema.parse({})

  expect(chains).toEqual({
    1: {
      id: 1,
      type: 'ethereum',
      layer: 'mainnet',
      name: 'Mainnet',
      isTestnet: false,
      explorer: 'https://etherscan.io',
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
      },
      on: true
    }
  })
})
