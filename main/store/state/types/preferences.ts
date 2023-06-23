import { z } from 'zod'

export const PreferencesSchema = z.object({
  hidden: z.boolean()
  // Can add other preferences here... e.g.
  // favourited: z.boolean().optional()
})

export const AssetPreferencesSchema = z.object({
  collections: z.record(PreferencesSchema),
  tokens: z.record(PreferencesSchema)
})

export type AssetPreferences = z.infer<typeof AssetPreferencesSchema>
