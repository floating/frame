import { z } from 'zod'
import { ColorwayPaletteSchema } from './colors'
import { ConnectionSchema } from './connection'
import { GasSchema } from './gas'
import { NativeCurrencySchema } from './nativeCurrency'

const layerValues = ['mainnet', 'rollup', 'sidechain', 'testnet'] as const

export const ChainIdSchema = z.object({
  id: z.coerce.number(),
  type: z.literal('ethereum')
})

export const ChainSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  on: z.boolean(),
  connection: z.object({
    primary: ConnectionSchema,
    secondary: ConnectionSchema
  }),
  layer: z.enum(layerValues).optional(),
  isTestnet: z.boolean().default(false),
  explorer: z.string().default('')
})

export const ChainMetadataSchema = z.object({
  blockHeight: z.number(),
  gas: GasSchema,
  icon: z.string().optional(),
  primaryColor: ColorwayPaletteSchema.keyof(),
  nativeCurrency: NativeCurrencySchema
})

export type ChainId = z.infer<typeof ChainIdSchema>
export type Chain = z.infer<typeof ChainSchema>
export type ChainMetadata = z.infer<typeof ChainMetadataSchema>
