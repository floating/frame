import { z } from 'zod'
import { v40PreferencesSchema } from '../../migrate/migrations/40'

const PreferencesSchema = v40PreferencesSchema

export const AssetPreferencesSchema = z.object({
  collections: z.record(PreferencesSchema),
  tokens: z.record(PreferencesSchema)
})

export type AssetPreferences = z.infer<typeof AssetPreferencesSchema>
