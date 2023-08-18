import { z } from 'zod'

const v37 = z
  .object({
    dontRemind: z.array(z.string())
  })
  .default({ dontRemind: [] })

const latestSchema = v37

const latest = v37.catch(() => latestSchema.parse(undefined))

export { v37, latest }
