import { z } from 'zod'

import { v38StateSchema as LegacyStateSchema } from '../38/schema'

const LegacyMainSchema = LegacyStateSchema.shape.main

// update connection schema to remove "poa" preset
const v39PresetValues = z.enum(['local', 'custom', 'pylon'])

const LegacyChainSchema = LegacyMainSchema.shape.networks.shape.ethereum.valueSchema
const LegacyConnectionSchema = LegacyChainSchema.shape.connection.shape.primary

const v39ConnectionSchema = LegacyConnectionSchema.merge(
  z.object({
    current: v39PresetValues
  })
)

const v39ChainSchema = LegacyChainSchema.merge(
  z.object({
    connection: z.object({
      primary: v39ConnectionSchema,
      secondary: v39ConnectionSchema
    })
  })
)

const v39MainSchema = z.object({
  ...LegacyMainSchema.shape,
  networks: z.object({
    ethereum: z.record(z.coerce.number(), v39ChainSchema)
  })
})

const v39StateSchema = z.object({
  ...LegacyStateSchema.shape,
  main: v39MainSchema
})

// export types needed for migration
export const LegacySchema = LegacyStateSchema

export type LegacyConnection = z.infer<typeof LegacyConnectionSchema>

export type v39Preset = z.infer<typeof v39PresetValues>
export type v39Connection = z.infer<typeof v39ConnectionSchema>
export type v39State = z.infer<typeof v39StateSchema>
