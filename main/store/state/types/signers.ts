import log from 'electron-log'
import { z } from 'zod'

const HotSignerValues = ['ring', 'seed'] as const
const HardwareSignerValues = ['trezor', 'ledger', 'lattice'] as const

const HotSignerTypes = z.enum(HotSignerValues)
const HardwareSignerTypes = z.enum(HardwareSignerValues)
export const DerivationTypes = z.enum(['legacy', 'standard', 'testnet'])
export const SignerTypes = z.enum([...HotSignerValues, ...HardwareSignerValues])

const SignerSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  model: z.string().default(''),
  type: SignerTypes,
  addresses: z.array(z.string()),
  status: z.string(),
  createdAt: z.number().default(0)
})

const v37 = z.record(SignerSchema)

const latest = z
  .record(SignerSchema)
  .catch((ctx) => {
    log.error('Could not parse signers, falling back to defaults', ctx.error)
    return {}
  })
  .default({})
  .transform(() => {
    // signers aren't persisted in the state
    return {} as Record<string, Signer>
  })

export { v37, latest }

export type HotSignerType = z.infer<typeof HotSignerTypes>
export type HardwareSignerType = z.infer<typeof HardwareSignerTypes>
export type SignerType = z.infer<typeof SignerTypes>
export type Signer = z.infer<typeof SignerSchema>
