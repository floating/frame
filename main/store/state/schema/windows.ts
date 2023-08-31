import { z } from 'zod'
import { schemaWithEmptyDefaults } from './util'

const WindowSchema = z.object({
  footer: z
    .object({
      height: z.number().default(40)
    })
    .default({ height: 40 }),
  showing: z.boolean().default(false),
  nav: z.array(z.any()).default([])
})

const windows = z
  .object({
    frames: z.array(z.any()).default([]),
    panel: schemaWithEmptyDefaults(WindowSchema),
    dash: schemaWithEmptyDefaults(WindowSchema)
  })
  .passthrough()

export default schemaWithEmptyDefaults(windows)
