import { z } from 'zod'
import {
  LegacyChainSchema,
  LegacyConnectionSchema,
  LegacyMainSchema,
  LegacyMuteSchema
} from '../legacy/schema'

const muteUpdates = z.object({ migrateToPylon: z.boolean().default(false) })
export const v36MuteSchema = LegacyMuteSchema.merge(muteUpdates).passthrough()

export const v36PresetSchema = z.enum(['local', 'custom', 'poa', 'pylon'])

const connectionUpdates = z.object({
  current: v36PresetSchema
})

export const v36ConnectionSchema = LegacyConnectionSchema.merge(connectionUpdates).passthrough()

const chainUpdates = z.object({
  connection: z.object({
    primary: v36ConnectionSchema,
    secondary: v36ConnectionSchema
  })
})

export const v36ChainSchema = LegacyChainSchema.merge(chainUpdates).passthrough()

const EthereumChainsSchema = z.record(z.coerce.number(), v36ChainSchema)

export const v36ChainsSchema = z.object({
  ethereum: EthereumChainsSchema
})

const mainUpdates = z.object({
  networks: v36ChainsSchema,
  mute: v36MuteSchema
})

export const v36MainSchema = LegacyMainSchema.merge(mainUpdates).passthrough()

export const v36StateSchema = z
  .object({
    main: v36MainSchema
  })
  .passthrough()

export type v36Preset = z.infer<typeof v36PresetSchema>
export type v36Connection = z.infer<typeof v36ConnectionSchema>
export type v36Chain = z.infer<typeof v36ChainSchema>
export type v36State = z.infer<typeof v36StateSchema>
