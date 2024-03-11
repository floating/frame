import { z } from 'zod'

import { ColorwayPaletteSchema } from './colors'
import { GasSchema } from './gas'
import { NativeCurrencySchema } from './nativeCurrency'

export const chainMetaDefaults = {
  1: {
    blockHeight: 0,
    gas: {
      fees: {},
      samples: [],
      price: {
        selected: 'standard',
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
    primaryColor: 'accent1' // Mainnet
  },
  10: {
    blockHeight: 0,
    gas: {
      fees: {},
      samples: [],
      price: {
        selected: 'standard',
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
    primaryColor: 'accent4' // Optimism
  },
  100: {
    blockHeight: 0,
    gas: {
      fees: {},
      samples: [],
      price: {
        selected: 'standard',
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
    primaryColor: 'accent5' // Gnosis
  },
  137: {
    blockHeight: 0,
    gas: {
      fees: {},
      samples: [],
      price: {
        selected: 'standard',
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
    primaryColor: 'accent6' // Polygon
  },
  8453: {
    blockHeight: 0,
    gas: {
      fees: {},
      samples: [],
      price: {
        selected: 'standard',
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
    primaryColor: 'accent8' // Base
  },
  42161: {
    blockHeight: 0,
    gas: {
      fees: {},
      samples: [],
      price: {
        selected: 'standard',
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
    primaryColor: 'accent7' // Arbitrum
  },
  84532: {
    blockHeight: 0,
    gas: {
      fees: {},
      samples: [],
      price: {
        selected: 'standard',
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
      name: 'Base Sepolia Ether',
      decimals: 18
    },
    icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/baseiconcolor.png',
    primaryColor: 'accent2' // Testnet
  },
  11155111: {
    blockHeight: 0,
    gas: {
      fees: {},
      samples: [],
      price: {
        selected: 'standard',
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
    primaryColor: 'accent2' // Testnet
  },
  11155420: {
    blockHeight: 0,
    gas: {
      fees: {},
      samples: [],
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
      name: 'Optimism Sepolia Ether',
      decimals: 18
    },
    icon: '',
    primaryColor: 'accent2' as const // Testnet
  }
}

export const ChainMetadataSchema = z
  .object({
    blockHeight: z.number().default(0),
    gas: GasSchema,
    icon: z.string().optional(),
    primaryColor: ColorwayPaletteSchema.keyof(),
    nativeCurrency: NativeCurrencySchema
  })
  .transform((metadata) => {
    // remove stale price data
    return {
      ...metadata,
      nativeCurrency: {
        ...metadata.nativeCurrency,
        usd: { price: 0, change24hr: 0 }
      }
    }
  })

export type ChainMetadata = z.infer<typeof ChainMetadataSchema>
