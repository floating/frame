import { z } from 'zod'
import { v40TokenBalance } from './tokens'

const BalanceSchema = z.object({
  balance: z.string().describe('Raw balance, in hex'),
  displayBalance: z.string()
})

const v40 = z.record(z.string().describe('Address'), z.array(v40TokenBalance))

const latest = v40
  .catch({})
  .default({})
  // remove stale balances
  .transform(() => ({}))

export { v40, latest }
export type Balance = z.infer<typeof BalanceSchema>
