import { z } from 'zod'
import {
  LegacyChainSchema,
  LegacyConnectionSchema,
  LegacyMainSchema,
  LegacyMuteSchema
} from '../legacy/schema'

const muteUpdates = z.object({ migrateToPylon: z.boolean().default(false) })

export const v35MuteSchema = LegacyMuteSchema.merge(muteUpdates).passthrough()

export const v35PresetSchema = z.enum(['local', 'custom', 'poa'])

const connectionUpdates = z.object({
  current: v35PresetSchema
})

export const v35ConnectionSchema = LegacyConnectionSchema.merge(connectionUpdates).passthrough()

const chainUpdates = z.object({
  connection: z.object({
    primary: v35ConnectionSchema,
    secondary: v35ConnectionSchema
  })
})

export const v35ChainSchema = LegacyChainSchema.merge(chainUpdates).passthrough()

const EthereumChainsSchema = z.record(z.coerce.number(), v35ChainSchema)

export const v35ChainsSchema = z.object({
  ethereum: EthereumChainsSchema
})

const mainUpdates = z.object({
  networks: v35ChainsSchema,
  mute: v35MuteSchema
})

export const v35MainSchema = LegacyMainSchema.merge(mainUpdates).passthrough()

export const v35StateSchema = z
  .object({
    main: v35MainSchema
  })
  .passthrough()

export type v35Preset = z.infer<typeof v35PresetSchema>
export type v35Connection = z.infer<typeof v35ConnectionSchema>
export type v35Chain = z.infer<typeof v35ChainSchema>
export type v35State = z.infer<typeof v35StateSchema>
