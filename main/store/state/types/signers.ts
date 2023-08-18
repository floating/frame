import log from 'electron-log'
import { z } from 'zod'

const HotSignerValues = ['ring', 'seed'] as const
const HardwareSignerValues = ['trezor', 'ledger', 'lattice'] as const

const HotSignerTypes = z.enum(HotSignerValues)
const HardwareSignerTypes = z.enum(HardwareSignerValues)
export const SignerTypes = z.enum([...HotSignerValues, ...HardwareSignerValues])

const SignerSchema = z.object({
  id: z.string(),
  name: z.string(),
  model: z.string(),
  type: SignerTypes,
  addresses: z.array(z.string()),
  status: z.string(),
  createdAt: z.number().default(0)
})

const v37 = z.record(SignerSchema)

const latestSchema = v37
const LatestSignerSchema = latestSchema.valueSchema

const latest = z
  .record(z.unknown())
  .catch((ctx) => {
    log.error('Could not parse signers, falling back to defaults', ctx.error)
    return {}
  })
  .default({})
  .transform((signersObject) => {
    const signers = {} as Record<string, Signer>

    for (const id in signersObject) {
      const signer = signersObject[id]
      const result = LatestSignerSchema.safeParse(signer)

      if (!result.success) {
        log.info(`Removing invalid signer ${id} from state`, result.error)
      } else {
        signers[id] = result.data
      }
    }

    return signers
  })

export { v37, latest }

export type HotSignerType = z.infer<typeof HotSignerTypes>
export type HardwareSignerType = z.infer<typeof HardwareSignerTypes>
export type SignerType = z.infer<typeof SignerTypes>
export type Signer = z.infer<typeof SignerSchema>
