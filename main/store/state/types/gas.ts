import { z } from 'zod'

const GasEstimateSchema = z.object({
  gasEstimate: z.string(),
  cost: z.object({
    usd: z.number().nullish()
  })
})

const GasSampleSchema = z.object({
  label: z.string(),
  estimates: z
    .object({
      low: GasEstimateSchema,
      high: GasEstimateSchema
    })
    .partial()
})

const GasLevelsSchema = z.object({
  slow: z.string().optional(),
  standard: z.string().optional(),
  fast: z.string().optional(),
  asap: z.string().optional(),
  custom: z.string().optional()
})

// TODO: validate these fields as hex amount values
export const GasFeesSchema = z.object({
  nextBaseFee: z.string(),
  maxBaseFeePerGas: z.string(),
  maxPriorityFeePerGas: z.string(),
  maxFeePerGas: z.string()
})

export const GasSchema = z.object({
  samples: z.array(GasSampleSchema).default([]),
  price: z.object({
    selected: GasLevelsSchema.keyof(),
    levels: GasLevelsSchema,
    fees: GasFeesSchema.nullish()
  })
})

export type Gas = z.infer<typeof GasSchema>
export type GasFees = z.infer<typeof GasFeesSchema>
