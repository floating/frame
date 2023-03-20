import { z } from 'zod'

const v35MuteSchema = z
  .object({
    migrateToPylon: z.boolean().default(false)
  })
  .passthrough()
  .default({})

const v35ConnectionSchema = z
  .object({
    current: z.enum(['local', 'custom', 'infura', 'alchemy', 'poa']),
    custom: z.string().default('')
  })
  .passthrough()

export const v35ChainSchema = z
  .object({
    id: z.coerce.number(),
    connection: z.object({
      primary: v35ConnectionSchema,
      secondary: v35ConnectionSchema
    })
  })
  .passthrough()

const EthereumChainsSchema = z.record(z.coerce.number(), v35ChainSchema)

export const v35ChainsSchema = z.object({
  ethereum: EthereumChainsSchema
})

export const v35MainSchema = z
  .object({
    networks: v35ChainsSchema,
    mute: v35MuteSchema
  })
  .passthrough()

export const v35StateSchema = z
  .object({
    main: v35MainSchema
  })
  .passthrough()

export type v35Connection = z.infer<typeof v35ConnectionSchema>
export type v35Chain = z.infer<typeof v35ChainSchema>
