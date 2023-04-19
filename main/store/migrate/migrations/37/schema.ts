import { z } from 'zod'

const v37MuteSchema = z
  .object({
    migrateToPylon: z.boolean().default(false)
  })
  .passthrough()
  .default({})

const v37ConnectionSchema = z
  .object({
    current: z.enum(['local', 'custom', 'infura', 'alchemy', 'poa']),
    custom: z.string().default('')
  })
  .passthrough()

export const v37ChainSchema = z
  .object({
    id: z.coerce.number(),
    connection: z.object({
      primary: v37ConnectionSchema,
      secondary: v37ConnectionSchema
    })
  })
  .passthrough()

const EthereumChainsSchema = z.record(z.coerce.number(), v37ChainSchema)

export const v37ChainsSchema = z.object({
  ethereum: EthereumChainsSchema
})

export const v37MainSchema = z
  .object({
    networks: v37ChainsSchema,
    mute: v37MuteSchema
  })
  .passthrough()

export const v37StateSchema = z
  .object({
    main: v37MainSchema
  })
  .passthrough()

export type v37Connection = z.infer<typeof v37ConnectionSchema>
export type v37Chain = z.infer<typeof v37ChainSchema>
