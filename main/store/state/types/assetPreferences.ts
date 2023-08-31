import log from 'electron-log'
import { z } from 'zod'

const PreferencesSchema = z.object({
  hidden: z.boolean().default(false)
})

const AssetPreferencesSchema = z.object({
  collections: z.record(PreferencesSchema).default({}),
  tokens: z.record(PreferencesSchema).default({})
})

const v40 = AssetPreferencesSchema
const latestSchema = v40

const latest = latestSchema
  .catch((ctx) => {
    log.error('Could not parse asset preferences, falling back to defaults', ctx.error)
    return latestSchema.parse({})
  })
  .default({})

export { v40, latest }

export type AssetPreferences = z.infer<typeof AssetPreferencesSchema>
