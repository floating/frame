import { z } from 'zod'
import { MediaSchema } from './media'

export const TokenIdSchema = z.object({
  address: z.string(),
  chainId: z.coerce.number()
})

const CoreTokenSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  decimals: z.number().positive(),
  media: MediaSchema
})

export const TokenSchema = CoreTokenSchema.merge(TokenIdSchema)

export type WithTokenId = z.infer<typeof TokenIdSchema>
export type Token = z.infer<typeof TokenSchema>
