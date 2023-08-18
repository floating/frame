import { z } from 'zod'

const emptyGasLevels = {
  slow: '',
  standard: '',
  fast: '',
  asap: '',
  custom: ''
} as const

const GasLevelsSchema = z.object({
  slow: z.string().optional(),
  standard: z.string().optional(),
  fast: z.string().optional(),
  asap: z.string().optional(),
  custom: z.string().optional()
})

const GasFeesSchema = z
  .object({
    nextBaseFee: z.string(),
    maxBaseFeePerGas: z.string(),
    maxPriorityFeePerGas: z.string(),
    maxFeePerGas: z.string()
  })
  .nullish()
  .default(null)
  .catch(null)

const GasPricesSchema = z
  .object({
    selected: GasLevelsSchema.keyof(),
    levels: GasLevelsSchema
  })
  .catch({ selected: 'standard', levels: emptyGasLevels })
  .default({ selected: 'standard', levels: emptyGasLevels })

const v37 = z.object({
  fees: GasFeesSchema,
  price: GasPricesSchema
})

const latestSchema = v37

const nullGasFees = null as z.infer<typeof GasFeesSchema>

const latest = latestSchema.transform((gas) => {
  // fees and prices arent persisted so always load them as null to begin with
  gas.fees = nullGasFees
  gas.price = {
    selected: gas.price.selected,
    levels: emptyGasLevels
  }

  return gas
})

export { v37, latest }
export type GasFees = z.infer<typeof GasFeesSchema>
export type Gas = z.infer<typeof latest>
