import { z } from 'zod'
import { schemaWithEmptyDefaults } from './util'

const tray = z.object({
  initial: z.boolean().default(true),
  open: z.boolean().default(false)
})

export default schemaWithEmptyDefaults(tray)
