import { z } from 'zod'

export const BalanceSchema = z.object({
  balance: z.string().describe('Raw balance, in hex'),
  displayBalance: z.string()
})

export type Balance = z.infer<typeof BalanceSchema>
