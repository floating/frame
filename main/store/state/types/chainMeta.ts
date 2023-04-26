import { z } from 'zod'

import { ColorwayPaletteSchema } from './colors'
import { GasSchema } from './gas'
import { NativeCurrencySchema } from './nativeCurrency'

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
