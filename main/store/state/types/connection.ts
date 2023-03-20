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
  on: z.boolean(),
  connected: z.boolean(),
  current: z.enum(presetValues),
  status: z.enum(statusValues),
  custom: z.string().default('')
})

export type Connection = z.infer<typeof ConnectionSchema>
