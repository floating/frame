import { z } from 'zod'

export const RateSchema = z.object({
  price: z.number(),
  change24hr: z.number()
})

export type Rate = z.infer<typeof RateSchema>
