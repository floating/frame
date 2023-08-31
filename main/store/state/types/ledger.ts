import { z } from 'zod'
import { DerivationTypes } from './signers'

const LedgerDerivationTypes = z.enum([...DerivationTypes._def.values, 'live'])

const v37 = z.object({
  derivation: LedgerDerivationTypes.default('live'),
  liveAccountLimit: z.number().default(5)
})

const latestSchema = v37

const latest = v37.catch(() => latestSchema.parse({})).default({})

export { v37, latest }
