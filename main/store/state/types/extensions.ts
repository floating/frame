import { z } from 'zod'

const v37 = z.record(z.boolean().default(false))

const latest = v37.catch({}).default({})

export { v37, latest }
