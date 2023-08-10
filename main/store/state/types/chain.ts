import { z } from 'zod'
import log from 'electron-log'

import { ConnectionSchema } from './connection'

const layerValues = ['mainnet', 'rollup', 'sidechain', 'testnet'] as const
const type = 'ethereum' as const

const chainDefaults = {
  1: {
    id: 1,
    type,
    layer: 'mainnet' as const,
    name: 'Mainnet',
    isTestnet: false,
    explorer: 'https://etherscan.io',
    on: true,
    connection: {
      primary: {
        on: true,
        current: 'pylon' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      },
      secondary: {
        on: false,
        current: 'custom' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      }
    }
  },
  5: {
    id: 5,
    type,
    layer: 'testnet' as const,
    isTestnet: true,
    name: 'Görli',
    explorer: 'https://goerli.etherscan.io',
    on: false,
    connection: {
      primary: {
        on: true,
        current: 'pylon' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      },
      secondary: {
        on: false,
        current: 'custom' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      }
    }
  },
  10: {
    id: 10,
    type,
    layer: 'rollup' as const,
    isTestnet: false,
    name: 'Optimism',
    explorer: 'https://optimistic.etherscan.io',
    on: false,
    connection: {
      primary: {
        on: true,
        current: 'pylon' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      },
      secondary: {
        on: false,
        current: 'custom' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      }
    }
  },
  100: {
    id: 100,
    type,
    layer: 'sidechain' as const,
    isTestnet: false,
    name: 'Gnosis',
    explorer: 'https://blockscout.com/xdai/mainnet',
    on: false,
    connection: {
      primary: {
        on: false,
        current: 'custom' as const,
        status: 'loading' as const,
        connected: false,
        custom: 'https://rpc.gnosischain.com'
      },
      secondary: {
        on: false,
        current: 'custom' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      }
    }
  },
  137: {
    id: 137,
    type,
    layer: 'sidechain' as const,
    isTestnet: false,
    name: 'Polygon',
    explorer: 'https://polygonscan.com',
    on: false,
    connection: {
      primary: {
        on: true,
        current: 'pylon' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      },
      secondary: {
        on: false,
        current: 'custom' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      }
    }
  },
  8453: {
    id: 8453,
    type,
    layer: 'rollup' as const,
    isTestnet: false,
    name: 'Base',
    explorer: 'https://basescan.org',
    connection: {
      primary: {
        on: true,
        current: 'pylon' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      },
      secondary: {
        on: false,
        current: 'custom' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      }
    },
    on: false
  },
  42161: {
    id: 42161,
    type,
    layer: 'rollup' as const,
    isTestnet: false,
    name: 'Arbitrum',
    explorer: 'https://arbiscan.io',
    on: false,
    connection: {
      primary: {
        on: true,
        current: 'pylon' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      },
      secondary: {
        on: false,
        current: 'custom' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      }
    }
  },
  84531: {
    id: 84531,
    type,
    layer: 'testnet' as const,
    isTestnet: true,
    name: 'Base Görli',
    explorer: 'https://goerli-explorer.base.org',
    on: false,
    connection: {
      primary: {
        on: true,
        current: 'custom' as const,
        status: 'loading' as const,
        connected: false,
        custom: 'https://goerli.base.org'
      },
      secondary: {
        on: false,
        current: 'custom' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      }
    }
  },
  11155111: {
    id: 11155111,
    type,
    layer: 'testnet' as const,
    isTestnet: true,
    name: 'Sepolia',
    explorer: 'https://sepolia.etherscan.io',
    on: false,
    connection: {
      primary: {
        on: true,
        current: 'pylon' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      },
      secondary: {
        on: false,
        current: 'custom' as const,
        status: 'loading' as const,
        connected: false,
        custom: ''
      }
    }
  }
}

function getReplacementChain(chainId: keyof typeof chainDefaults) {
  const defaultChain = chainDefaults[chainId]

  // ensure all chains that are replaced in state with a
  // default value are not using any custom RPC presets to prevent
  // forcing users to use unwanted third party connections
  defaultChain.connection.primary.current = 'custom'
  defaultChain.connection.secondary.current = 'custom'

  return defaultChain
}

export const ChainIdSchema = z.object({
  id: z.coerce.number(),
  type: z.literal('ethereum')
})

export const ChainSchema = ChainIdSchema.merge(
  z.object({
    name: z.string(),
    on: z.boolean().default(false),
    connection: z.object({
      primary: ConnectionSchema,
      secondary: ConnectionSchema
    }),
    layer: z.enum(layerValues).optional(),
    isTestnet: z.boolean().default(false),
    explorer: z.string().default('')
  })
).transform((chain) => {
  // all chains should start disconnected by default
  return {
    ...chain,
    connection: {
      ...chain.connection,
      primary: {
        ...chain.connection.primary,
        connected: false
      },
      secondary: {
        ...chain.connection.secondary,
        connected: false
      }
    }
  }
})

const ChainsSchema = z.record(z.coerce.number(), z.unknown()).transform((chainsObject) => {
  const chains = {} as Record<number, Chain>

  for (const id in chainsObject) {
    const chainId = parseInt(id)
    const chain = chainsObject[chainId]
    const result = ChainSchema.safeParse(chain)

    if (!result.success) {
      log.info(`Removing invalid chain ${id} from state`, result.error)

      if (chainId in chainDefaults) {
        chains[chainId] = getReplacementChain(chainId as keyof typeof chainDefaults)
      }
    } else {
      chains[chainId] = result.data
    }
  }

  // add mainnet if it's not already there
  return {
    ...chains,
    1: chains['1'] || getReplacementChain(1)
  } as Record<number, Chain>
})

export const EthereumChainsSchema = z
  .object({
    ethereum: ChainsSchema
  })
  .catch((ctx) => {
    log.error('Could not parse chains, falling back to defaults', ctx.error)
    return { ethereum: chainDefaults }
  })
  .default({ ethereum: chainDefaults })

export type ChainId = z.infer<typeof ChainIdSchema>
export type Chain = z.infer<typeof ChainSchema>
