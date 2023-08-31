import { z } from 'zod'

const v37 = z.record(z.boolean().default(false))

const latest = v37
  .catch({})
  .default({})
  .transform((extensionsObject) => {
    return Object.fromEntries(Object.entries(extensionsObject).filter((_id, enabled) => enabled))
  })

export { v37, latest }
