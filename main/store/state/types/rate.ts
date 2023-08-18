import { z } from 'zod'

const v37 = z
  .object({
    price: z.number(),
    change24hr: z.number()
  })
  // remove stale price data
  .transform((rate) => ({ ...rate, price: 0, change24hr: 0 }))

const latest = v37

export { v37, latest }
export type Rate = z.infer<typeof latest>
