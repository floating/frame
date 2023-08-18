import { z } from 'zod'

// these are individual top-level keys on the main state object
const v37 = z.object({
  launch: z.boolean().default(false).describe('Launch Frame on system start'),
  reveal: z.boolean().default(false).describe('Show Frame when user glides mouse to edge of screen'),
  autohide: z.boolean().default(false).describe('Automatically hide Frame when it loses focus'),
  accountCloseLock: z
    .boolean()
    .default(false)
    .describe("Lock an account when it's closed instead of when Frame restarts"),
  showLocalNameWithENS: z.boolean(),
  menubarGasPrice: z.boolean().default(false).describe('Show gas price in menu bar')
})

const latest = v37

export { v37, latest }

export const MainSchema = z.object({}).default({})
