import log from 'electron-log'
import { z } from 'zod'

import { v37 as v37GasSchema, latest as latestGasSchema } from './gas'
import { v37 as v37NativeCurrencySchema, latest as latestNativeCurrencySchema } from './nativeCurrency'

export const chainMetadataDefaults = {
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
  },
  5: {
    blockHeight: 0,
    gas: {
      fees: null,
      price: {
        selected: 'standard' as const,
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
    primaryColor: 'accent2' as const // Testnet
  },
  10: {
    blockHeight: 0,
    gas: {
      fees: null,
      price: {
        selected: 'standard' as const,
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    nativeCurrency: {
      usd: {
        price: 0,
        change24hr: 0
      },
      icon: '',
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/optimism.svg',
    primaryColor: 'accent4' as const // Optimism
  },
  100: {
    blockHeight: 0,
    gas: {
      fees: null,
      price: {
        selected: 'standard' as const,
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    nativeCurrency: {
      symbol: 'xDAI',
      usd: {
        price: 0,
        change24hr: 0
      },
      icon: '',
      name: 'xDAI',
      decimals: 18
    },
    icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/gnosis.svg',
    primaryColor: 'accent5' as const // Gnosis
  },
  137: {
    blockHeight: 0,
    gas: {
      fees: null,
      price: {
        selected: 'standard' as const,
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    nativeCurrency: {
      symbol: 'MATIC',
      usd: {
        price: 0,
        change24hr: 0
      },
      icon: '',
      name: 'Matic',
      decimals: 18
    },
    icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/polygon.svg',
    primaryColor: 'accent6' as const // Polygon
  },
  8453: {
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
      icon: '',
      name: 'Ether',
      decimals: 18
    },
    icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/baseiconcolor.png',
    primaryColor: 'accent8' as const // Base
  },
  42161: {
    blockHeight: 0,
    gas: {
      fees: null,
      price: {
        selected: 'standard' as const,
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    nativeCurrency: {
      usd: {
        price: 0,
        change24hr: 0
      },
      icon: '',
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/arbitrum.svg',
    primaryColor: 'accent7' as const // Arbitrum
  },
  84531: {
    blockHeight: 0,
    gas: {
      fees: null,
      price: {
        selected: 'standard' as const,
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
    icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/baseiconcolor.png',
    primaryColor: 'accent2' as const // Testnet
  },
  11155111: {
    blockHeight: 0,
    gas: {
      fees: null,
      price: {
        selected: 'standard' as const,
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    nativeCurrency: {
      symbol: 'sepETH',
      usd: {
        price: 0,
        change24hr: 0
      },
      icon: '',
      name: 'Sepolia Ether',
      decimals: 18
    },
    icon: '',
    primaryColor: 'accent2' as const // Testnet
  }
}

const ColorSchema = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number()
})

const ColorwayPaletteSchema = z.object({
  accent1: ColorSchema,
  accent2: ColorSchema,
  accent3: ColorSchema,
  accent4: ColorSchema,
  accent5: ColorSchema,
  accent6: ColorSchema,
  accent7: ColorSchema,
  accent8: ColorSchema
})

const v37 = z.object({
  ethereum: z.record(
    z.object({
      blockHeight: z.number().default(0),
      gas: v37GasSchema,
      icon: z.string().optional(),
      primaryColor: ColorwayPaletteSchema.keyof().catch('accent1').default('accent1'),
      nativeCurrency: v37NativeCurrencySchema
    })
  )
})

const latestSchema = v37

// use the latest versions of all schemas when parsing in order to provide correct
// defaults and transformations
const LatestMetadataSchema = latestSchema.shape.ethereum.valueSchema.extend({
  gas: latestGasSchema,
  nativeCurrency: latestNativeCurrencySchema
})

const ChainMetadataSchema = z.record(z.coerce.number(), z.unknown()).transform((metadataObject) => {
  const chains = {} as Record<number, ChainMetadata>

  for (const id in metadataObject) {
    const chainId = parseInt(id)
    const chain = metadataObject[chainId]
    const result = LatestMetadataSchema.safeParse(chain)

    if (!result.success) {
      log.info(`Removing invalid chain metadata ${id} from state`, result.error)

      if (chainId in chainMetadataDefaults) {
        chains[chainId] = chainMetadataDefaults[chainId as keyof typeof chainMetadataDefaults]
      }
    } else {
      chains[chainId] = result.data
    }
  }

  // add mainnet if it's not already there
  return {
    ...chains,
    1: chains['1'] || chainMetadataDefaults['1']
  } as Record<number, ChainMetadata>
})

const latest = z
  .object({
    ethereum: ChainMetadataSchema
  })
  .catch((ctx) => {
    log.error('Could not parse chain metadata, falling back to defaults', ctx.error)
    return { ethereum: chainMetadataDefaults }
  })
  .default({ ethereum: chainMetadataDefaults })

export { v37, latest }
export type ChainMetadata = z.infer<typeof LatestMetadataSchema>
export type ColorwayPalette = z.infer<typeof ColorwayPaletteSchema>
