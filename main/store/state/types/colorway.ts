import { z } from 'zod'

const v37 = z.enum(['light', 'dark']).catch('dark').default('dark')

const latest = v37

export { v37, latest }
