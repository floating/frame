import { z } from 'zod'

const modifierKey = z.enum(['Alt', 'Control', 'Meta'])

export const ShortcutSchema = z.object({
  modifierKeys: z.array(modifierKey).default([]),
  shortcutKey: z.string(),
  enabled: z.boolean().default(true),
  configuring: z.boolean().default(false)
})

export type Shortcut = z.infer<typeof ShortcutSchema>
