import { z } from 'zod'
import { v36ChainSchema, v36ConnectionSchema, v36MainSchema } from '../36/schema'

export const v37PresetSchema = z.enum(['local', 'custom', 'pylon'])

const connectionUpdates = z.object({
  current: v37PresetSchema
})

export const v37ConnectionSchema = v36ConnectionSchema.merge(connectionUpdates).passthrough()

const chainUpdates = z.object({
  connection: z.object({
    primary: v36ConnectionSchema,
    secondary: v36ConnectionSchema
  })
})

export const v37ChainSchema = v36ChainSchema.merge(chainUpdates).passthrough()

const EthereumChainsSchema = z.record(z.coerce.number(), v37ChainSchema)

export const v37ChainsSchema = z.object({
  ethereum: EthereumChainsSchema
})

const mainUpdates = z.object({
  networks: v37ChainsSchema
})

export const v37MainSchema = v36MainSchema.merge(mainUpdates).passthrough()

export const v37StateSchema = z
  .object({
    main: v36MainSchema
  })
  .passthrough()

export type v37Preset = z.infer<typeof v37PresetSchema>
export type v37Connection = z.infer<typeof v37ConnectionSchema>
export type v37State = z.infer<typeof v37StateSchema>
