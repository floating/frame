import { z } from 'zod'

import { v40TokenBalanceSchema, v40TokenSchema } from '../../migrate/migrations/40'

export const TokenIdSchema = z.object({
  address: z.string(),
  chainId: z.coerce.number()
})

export const TokenSchema = v40TokenSchema
export const TokenBalanceSchema = v40TokenBalanceSchema

export type WithTokenId = z.infer<typeof TokenIdSchema>
export type Token = z.infer<typeof TokenSchema>
export type TokenBalance = z.infer<typeof TokenBalanceSchema>
