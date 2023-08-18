import { z } from 'zod'

import { v37 as v37RateSchema } from './rate'

const v37 = z.object({
  symbol: z.string(),
  icon: z.string().default(''),
  name: z.string(),
  decimals: z.number(),
  usd: v37RateSchema
})

const latest = v37

export { v37, latest }
export type NativeCurrency = z.infer<typeof latest>
