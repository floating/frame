import { EthereumChainsMetadataSchema } from '../../../../../main/store/state/types/chainMeta'

const validChainMetadata = {
  blockHeight: 164738849,
  gas: {
    fees: {
      nextBaseFee: '0xa8f8',
      maxBaseFeePerGas: '0xa8f8',
      maxPriorityFeePerGas: '0xa8f8',
      maxFeePerGas: '0xa8f8'
    },
    price: {
      selected: 'fast',
      levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
    }
  },
  nativeCurrency: {
    symbol: 'görETH',
    usd: {
      price: 0,
      change24hr: 0
    },
    icon: '',
    name: 'Görli Ether',
    decimals: 18
  },
  icon: 'https://mydrive.io/someimage.png',
  primaryColor: 'accent2'
}

it('provides default chain metadata for an empty state', () => {
  const { ethereum: chainMetadata } = EthereumChainsMetadataSchema.parse(undefined)

  expect(Object.keys(chainMetadata)).toEqual([
    '1',
    '5',
    '10',
    '100',
    '137',
    '8453',
    '42161',
    '84531',
    '11155111'
  ])
})

it('handles a corrupted state with the wrong key', () => {
  const { ethereum: chainMetadata } = EthereumChainsMetadataSchema.parse({ bogus: 'test' })

  expect(Object.keys(chainMetadata)).toEqual([
    '1',
    '5',
    '10',
    '100',
    '137',
    '8453',
    '42161',
    '84531',
    '11155111'
  ])
})

it('handles a corrupted state with the wrong structure of the ethereum object', () => {
  const { ethereum: chainMetadata } = EthereumChainsMetadataSchema.parse({ ethereum: 'test' })

  expect(Object.keys(chainMetadata)).toEqual([
    '1',
    '5',
    '10',
    '100',
    '137',
    '8453',
    '42161',
    '84531',
    '11155111'
  ])
})

it('parses valid chain metadata', () => {
  const { ethereum: chains } = EthereumChainsMetadataSchema.parse({ ethereum: { 5: validChainMetadata } })

  expect(chains['5']).toEqual({
    ...validChainMetadata,
    gas: {
      ...validChainMetadata.gas,
      fees: null
    }
  })
})

it('removes any persisted native currency price', () => {
  const previousChainMetadata = {
    ...validChainMetadata,
    nativeCurrency: {
      ...validChainMetadata.nativeCurrency,
      usd: {
        price: 100,
        change24hr: -2.12
      }
    }
  }

  const { ethereum: chains } = EthereumChainsMetadataSchema.parse({ ethereum: { 5: previousChainMetadata } })

  expect(chains['5'].nativeCurrency.usd).toEqual({ price: 0, change24hr: 0 })
})

it('replaces a corrupt chain with a known id with the default value from the state', () => {
  const chain = {
    test: 'bogusvalue'
  }

  const { ethereum: chains } = EthereumChainsMetadataSchema.parse({ ethereum: { 5: chain } })

  expect(chains['5']).toEqual({
    blockHeight: 0,
    gas: {
      fees: null,
      price: {
        selected: 'standard',
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    nativeCurrency: {
      symbol: 'görETH',
      usd: {
        price: 0,
        change24hr: 0
      },
      icon: '',
      name: 'Görli Ether',
      decimals: 18
    },
    icon: '',
    primaryColor: 'accent2'
  })
})

it('removes an unknown corrupt chain from the state', () => {
  const chain = {
    test: 'bogusvalue'
  }

  const { ethereum: chains } = EthereumChainsMetadataSchema.parse({ ethereum: { 15: chain } })

  expect(chains['15']).toBeUndefined()
})

it('adds mainnet if not present in the state', () => {
  const { ethereum: chains } = EthereumChainsMetadataSchema.parse({ ethereum: {} })

  expect(chains).toEqual({
    1: {
      blockHeight: 0,
      gas: {
        fees: null,
        price: {
          selected: 'standard' as const,
          levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
        }
      },
      nativeCurrency: {
        symbol: 'ETH',
        usd: {
          price: 0,
          change24hr: 0
        },
        icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
        name: 'Ether',
        decimals: 18
      },
      icon: '',
      primaryColor: 'accent1' as const // Mainnet
    }
  })
})
