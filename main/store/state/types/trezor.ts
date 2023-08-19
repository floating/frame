import { z } from 'zod'
import { DerivationTypes } from './signers'

const v37 = z.object({
  derivation: DerivationTypes.default('standard')
})

const latestSchema = v37
const latest = v37.catch(() => latestSchema.parse({})).default({})

export { v37, latest }
