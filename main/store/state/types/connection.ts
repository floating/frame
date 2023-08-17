import { z } from 'zod'

const statusValues = [
  'connected',
  'disconnected',
  'loading',
  'standby',
  'off',
  'error',
  'chain mismatch'
] as const

const v37 = z.object({
  on: z.boolean().default(false),
  connected: z.boolean().default(false),
  current: z.enum(['local', 'custom', 'infura', 'alchemy', 'poa']).default('custom'),
  status: z.enum(statusValues).default('off'),
  custom: z.string().default('')
})

const v38 = v37.extend({
  current: z.enum(['local', 'custom', 'pylon', 'poa']).default('custom')
})

const v39 = v38.extend({
  current: z.enum(['local', 'custom', 'pylon']).default('custom')
})

const latestSchema = v39

// all connections should start disconnected by default
const latest = latestSchema.transform((connection) => ({ ...connection, connected: false }))

export { v37, v38, v39, latest }
