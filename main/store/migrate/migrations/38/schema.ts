import { z } from 'zod'

import { v37StateSchema as LegacyStateSchema } from '../37/schema'

const LegacyMainSchema = LegacyStateSchema.shape.main

// update connection schema to remove "poa" preset
const v38PresetValues = z.enum(['local', 'custom', 'pylon'])

const LegacyChainSchema = LegacyMainSchema.shape.networks.shape.ethereum.valueSchema
const LegacyConnectionSchema = LegacyChainSchema.shape.connection.shape.primary

const v38ConnectionSchema = LegacyConnectionSchema.merge(
  z.object({
    current: v38PresetValues
  })
)

const v38ChainSchema = LegacyChainSchema.merge(
  z.object({
    connection: z.object({
      primary: v38ConnectionSchema,
      secondary: v38ConnectionSchema
    })
  })
)

const v38MainSchema = z.object({
  ...LegacyMainSchema.shape,
  networks: z.object({
    ethereum: z.record(z.coerce.number(), v38ChainSchema)
  })
})

const v38StateSchema = z.object({
  ...LegacyStateSchema.shape,
  main: v38MainSchema
})

// export types needed for migration
export const LegacySchema = LegacyStateSchema

export type LegacyConnection = z.infer<typeof LegacyConnectionSchema>

export type v38Preset = z.infer<typeof v38PresetValues>
export type v38Connection = z.infer<typeof v38ConnectionSchema>
export type v38State = z.infer<typeof v38StateSchema>
