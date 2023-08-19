import { z } from 'zod'
import { DerivationTypes } from './signers'

const v37 = z.object({
  derivation: DerivationTypes.default('standard'),
  accountLimit: z.number().default(5),
  endpointCustom: z.string().default(''),
  endpointMode: z.enum(['default', 'custom']).default('default')
})

const latestSchema = v37
const latest = v37.catch(() => latestSchema.parse({})).default({})

export { v37, latest }
