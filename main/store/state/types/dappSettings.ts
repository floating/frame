import { z } from 'zod'

const v37 = z.object({
  details: z.object({}).passthrough().default({}),
  map: z
    .object({
      added: z.array(z.any()).default([]),
      docked: z.array(z.any()).default([])
    })
    .default({}),
  removed: z.array(z.any()).default([]),
  storage: z.object({}).passthrough().default({})
})

const latestSchema = v37
const latest = v37.catch(() => latestSchema.parse({})).default({})

export { v37, latest }
