import { z } from 'zod'

export const RateSchema = z.object({
  price: z.number(),
  change24hr: z.number()
})
export const UsdRateSchema = z.object({
  usd: RateSchema.optional()
})

export type Rate = z.infer<typeof RateSchema>
export type UsdRate = z.infer<typeof UsdRateSchema>
