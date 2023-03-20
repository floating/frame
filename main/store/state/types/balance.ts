import { z } from 'zod'

import { TokenIdSchema } from './token'

const CoreBalanceSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  balance: z.string().describe('Raw balance, in hex'),
  decimals: z.number().positive(),
  displayBalance: z.string()
})

export const BalanceSchema = CoreBalanceSchema.merge(TokenIdSchema)

export type Balance = z.infer<typeof BalanceSchema>
