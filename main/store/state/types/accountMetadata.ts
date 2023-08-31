import log from 'electron-log'
import { z } from 'zod'

const AccountMetadataSchema = z.object({
  name: z.string(),
  lastUpdated: z.number().optional()
})

const v37 = z.record(AccountMetadataSchema)

const latestSchema = v37
const LatestAccountMetadataSchema = latestSchema.valueSchema

const latest = z
  .record(z.unknown())
  .catch((ctx) => {
    log.error('Could not parse account metadata, falling back to defaults', ctx.error)
    return {}
  })
  .default({})
  .transform((accountMetadataObject) => {
    const accountMetadata = {} as Record<string, AccountMetadata>

    for (const id in accountMetadataObject) {
      const metadata = accountMetadataObject[id]
      const result = LatestAccountMetadataSchema.safeParse(metadata)

      if (!result.success) {
        log.info(`Removing invalid account metadata ${id} from state`, result.error)
      } else {
        accountMetadata[id] = result.data
      }
    }

    return accountMetadata
  })

export { v37, latest }

export type AccountMetadata = z.infer<typeof AccountMetadataSchema>
