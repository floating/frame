import { z } from 'zod'

const v37 = z.enum(['light', 'dark']).catch('light').default('light')

const latest = v37

export { v37, latest }
