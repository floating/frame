import { z } from 'zod'

// fees and prices arent persisted so always load them as null to begin with

const emptyGasLevels = {
  slow: '',
  standard: '',
  fast: '',
  asap: '',
  custom: ''
}

const GasLevelsObjectSchema = z.object({
  slow: z.string().optional(),
  standard: z.string().optional(),
  fast: z.string().optional(),
  asap: z.string().optional(),
  custom: z.string().optional()
})

export type GasLevels = z.infer<typeof GasLevelsObjectSchema>

export const GasLevelsSchema = GasLevelsObjectSchema.transform(() => emptyGasLevels).catch(emptyGasLevels)

const GasFeesObjectSchema = z
  .object({
    nextBaseFee: z.string(),
    maxBaseFeePerGas: z.string(),
    maxPriorityFeePerGas: z.string(),
    maxFeePerGas: z.string()
  })
  .nullish()

export type GasFees = z.infer<typeof GasFeesObjectSchema> | null

// TODO: validate these fields as hex amount values
export const GasFeesSchema = GasFeesObjectSchema.nullish()
  .transform(() => null as GasFees)
  .catch(null)

export const GasSchema = z.object({
  fees: GasFeesSchema,
  price: z.object({
    selected: GasLevelsObjectSchema.keyof(),
    levels: GasLevelsSchema
  })
})

export type Gas = z.infer<typeof GasSchema>
