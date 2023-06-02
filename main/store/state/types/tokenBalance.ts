import { z } from 'zod'
import { BalanceSchema } from './balance'
import { MediaSchema } from './media'

export const TokenBalanceSchema = BalanceSchema.merge(z.object({ media: MediaSchema }))

export type TokenBalance = z.infer<typeof TokenBalanceSchema>
