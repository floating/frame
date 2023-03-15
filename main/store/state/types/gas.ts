import { z } from 'zod'

const GasLevelsSchema = z.object({
  slow: z.string().optional(),
  standard: z.string().optional(),
  fast: z.string().optional(),
  asap: z.string().optional(),
  custom: z.string().optional()
})

// TODO: validate these fields as hex amount values
export const GasFeesSchema = z.object({
  nextBaseFee: z.string().optional(),
  maxBaseFeePerGas: z.string().optional(),
  maxPriorityFeePerGas: z.string().optional(),
  maxFeePerGas: z.string().optional()
})

export const GasSchema = z.object({
  price: z.object({
    selected: GasLevelsSchema.keyof(),
    levels: GasLevelsSchema,
    fees: GasFeesSchema.nullish()
  })
})

export type Gas = z.infer<typeof GasSchema>
export type GasFees = z.infer<typeof GasFeesSchema>
