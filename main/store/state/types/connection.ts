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

const presetValues = ['local', 'custom', 'pylon'] as const

export const ConnectionSchema = z.object({
  on: z.boolean().default(false),
  connected: z.boolean().default(false),
  current: z.enum(presetValues).default('custom'),
  status: z.enum(statusValues).default('off'),
  custom: z.string().default('')
})

export type Connection = z.infer<typeof ConnectionSchema>
