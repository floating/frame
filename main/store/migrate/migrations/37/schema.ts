import { z } from 'zod'
import { v35MainSchema, v35StateSchema } from '../35/schema'

const v37ShortcutsSchema = z.object({
  summon: z.object({
    modifierKeys: z.array(z.enum(['Alt', 'Ctrl', 'Meta', 'Cmd'])),
    shortcutKey: z.string(),
    enabled: z.boolean(),
    configuring: z.boolean()
  })
})

const v37MainSchema = v35MainSchema.merge(z.object({ shortcuts: v37ShortcutsSchema }))
const mainUpdates = z.object({ main: v37MainSchema }).passthrough()

export const v37StateSchema = v35StateSchema.merge(mainUpdates).passthrough()

export type v37State = z.infer<typeof v37StateSchema>
