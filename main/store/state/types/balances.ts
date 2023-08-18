import { z } from 'zod'

const BalanceSchema = z.object({
  balance: z.string().describe('Raw balance, in hex'),
  displayBalance: z.string()
})

const v37 = z.record(z.string().describe('Address'), z.array(BalanceSchema))

const latest = v37.catch({}).default({})

export { v37, latest }
export type Balance = z.infer<typeof BalanceSchema>
