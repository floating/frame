import { z } from 'zod'

export const PreferencesEntrySchema = z.object({
  hidden: z.boolean()
  // Can add other preferences here... e.g.
  // favourited: z.boolean().optional()
})

export const PreferencesDictionarySchema = z.record(PreferencesEntrySchema)

export const PreferencesSchema = z.object({
  collections: PreferencesDictionarySchema,
  tokens: PreferencesDictionarySchema
})

export type Preferences = z.infer<typeof PreferencesSchema>
export type PreferencesEntry = z.infer<typeof PreferencesEntrySchema>
export type PreferencesDictionary = z.infer<typeof PreferencesDictionarySchema>
