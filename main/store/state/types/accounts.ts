import log from 'electron-log'
import { z } from 'zod'
import { SignerTypes } from './signers'

const LastSignerTypes = z.enum([...SignerTypes.options, 'Address'])

const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastSignerType: LastSignerTypes,
  status: z.enum(['ok']),
  active: z.boolean().default(false),
  address: z.string(),
  signer: z.string().optional(),
  ensName: z.string().optional(),
  created: z.string(),
  balances: z.object({
    lastUpdated: z.number().optional()
  }),
  requests: z.record(z.any()).default({})
})

const v37 = z.record(AccountSchema)

const latestSchema = v37
const LatestAccountSchema = latestSchema.valueSchema

const latest = z
  .record(z.unknown())
  .catch((ctx) => {
    log.error('Could not parse accounts, falling back to defaults', ctx.error)
    return {}
  })
  .default({})
  .transform((accountsObject) => {
    const accounts = {} as Record<string, Account>

    for (const id in accountsObject) {
      const account = accountsObject[id]
      const result = LatestAccountSchema.safeParse(account)

      if (!result.success) {
        log.info(`Removing invalid account ${id} from state`, result.error)
      } else {
        const account = result.data

        accounts[id] = {
          ...account,
          balances: {
            lastUpdated: 0
          }
        }
      }
    }

    return accounts
  })

export { v37, latest }

export type Account = z.infer<typeof AccountSchema>
