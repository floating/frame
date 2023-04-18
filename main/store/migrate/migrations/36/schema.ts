import { z } from 'zod'

const v36MuteSchema = z
  .object({
    migrateToPylon: z.boolean().default(false)
  })
  .passthrough()
  .default({})

const v36ConnectionSchema = z
  .object({
    current: z.enum(['local', 'custom', 'infura', 'alchemy', 'poa']),
    custom: z.string().default('')
  })
  .passthrough()

export const v36ChainSchema = z
  .object({
    id: z.coerce.number(),
    connection: z.object({
      primary: v36ConnectionSchema,
      secondary: v36ConnectionSchema
    })
  })
  .passthrough()

const EthereumChainsSchema = z.record(z.coerce.number(), v36ChainSchema)

export const v36ChainsSchema = z.object({
  ethereum: EthereumChainsSchema
})

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
