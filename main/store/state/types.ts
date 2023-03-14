import { z } from 'zod'

const ConnectionSpec = z.object({
  on: z.boolean(),
  connected: z.boolean(),
  current: z.enum(['local', 'custom', 'pylon']),
  status: z.enum(['connected', 'disconnected', 'loading', 'standby', 'off', 'error', 'chain mismatch']),
  custom: z.string().default('')
})

const ChainSpec = z.object({
  id: z.coerce.number(),
  name: z.string(),
  on: z.boolean(),
  connection: z.object({
    primary: ConnectionSpec,
    secondary: ConnectionSpec
  }),
  layer: z.enum(['mainnet', 'rollup', 'sidechain', 'testnet']).optional(),
  isTestnet: z.boolean().default(false),
  explorer: z.string().default('')
})

export type Connection = z.infer<typeof ConnectionSpec>
export type Chain = z.infer<typeof ChainSpec>
