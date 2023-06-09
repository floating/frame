import { z } from 'zod'

import { v39TokenBalanceSchema, v39TokenSchema } from '../../migrate/migrations/39'

export const TokenIdSchema = z.object({
  address: z.string(),
  chainId: z.coerce.number()
})

export const TokenSchema = v39TokenSchema
export const TokenBalanceSchema = v39TokenBalanceSchema

export type WithTokenId = z.infer<typeof TokenIdSchema>
export type Token = z.infer<typeof TokenSchema>
export type TokenBalance = z.infer<typeof TokenBalanceSchema>
