import log from 'electron-log'
import { z } from 'zod'

const v37 = z.object({
  errorReporting: z.boolean().default(true)
})

const latestSchema = v37

const latest = v37
  .catch((ctx) => {
    log.error('Could not parse privacy settings, falling back to defaults', ctx.error)
    return latestSchema.parse({})
  })
  .default({})

export { v37, latest }
