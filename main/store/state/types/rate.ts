import { z } from 'zod'

export const CurrencyRateSchema = z.object({
  price: z.number(),
  change24hr: z.number()
})

// key is the currency symbol
const RateSchema = z.record(CurrencyRateSchema)

// key is the identifier of the asset
export const RatesSchema = z.record(RateSchema)

export type Rate = z.infer<typeof CurrencyRateSchema>
export type Rates = z.infer<typeof RatesSchema>
