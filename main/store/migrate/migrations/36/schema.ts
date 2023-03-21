import { z } from 'zod'
import { v35ChainSchema, v35ConnectionSchema, v35MainSchema } from '../35/schema'

export const v36PresetSchema = z.enum(['local', 'custom'])

const connectionUpdates = z.object({
  current: v36PresetSchema
})

export const v36ConnectionSchema = v35ConnectionSchema.merge(connectionUpdates).passthrough()

const chainUpdates = z.object({
  connection: z.object({
    primary: v35ConnectionSchema,
    secondary: v35ConnectionSchema
  })
})

export const v36ChainSchema = v35ChainSchema.merge(chainUpdates).passthrough()

const EthereumChainsSchema = z.record(z.coerce.number(), v36ChainSchema)

export const v36ChainsSchema = z.object({
  ethereum: EthereumChainsSchema
})

<<<<<<< HEAD
export const v36MainSchema = z
  .object({
    networks: v36ChainsSchema,
    mute: v36MuteSchema
  })
  .passthrough()

export const v36StateSchema = z
  .object({
    main: v36MainSchema
  })
  .passthrough()

export type v36Connection = z.infer<typeof v36ConnectionSchema>
export type v36Chain = z.infer<typeof v36ChainSchema>
=======
const mainUpdates = z.object({
  networks: v36ChainsSchema
})

export const v36MainSchema = v35MainSchema.merge(mainUpdates).passthrough()

export const v36StateSchema = z
  .object({
    main: v35MainSchema
  })
  .passthrough()

export type v36Preset = z.infer<typeof v36PresetSchema>
export type v36Connection = z.infer<typeof v36ConnectionSchema>
export type v36State = z.infer<typeof v36StateSchema>
>>>>>>> add more type safety
