import log from 'electron-log'
import { z } from 'zod'

// TODO: define manifest schema
const ManifestSchema = z.any()

const DappSchema = z.object({
  id: z.string().optional(),
  ens: z.string().optional(),
  status: z.enum(['initial', 'loading', 'updating', 'ready', 'failed']),
  config: z.record(z.string()),
  content: z.string().optional(),
  manifest: ManifestSchema,
  openWhenReady: z.boolean().default(false),
  checkStatusRetryCount: z.number().gte(0).default(0)
})

const v37 = z.record(z.string().describe('Dapp Id'), DappSchema)

const latestSchema = v37
const LatestDappSchema = latestSchema.valueSchema

const latest = z
  .record(z.unknown())
  .catch({})
  .default({})
  .transform((dappsObject) => {
    const dapps = {} as Record<string, Dapp>

    for (const id in dappsObject) {
      const result = LatestDappSchema.safeParse(dappsObject[id])

      if (!result.success) {
        log.info(`Removing invalid dapp ${id} from state`, result.error)
      } else {
        const dapp = result.data

        dapps[id] = {
          ...dapp,
          openWhenReady: false,
          checkStatusRetryCount: 0
        }
      }
    }

    return dapps
  })

export { v37, latest }
export type Dapp = z.infer<typeof DappSchema>
