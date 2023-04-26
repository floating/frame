import { z } from 'zod'
import { SignerTypes } from './signer'

export const AccountMetadataSchema = z.object({
  name: z.string(),
  lastUpdated: z.number().optional()
})

export const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastSignerType: SignerTypes,
  status: z.enum(['ok']),
  active: z.boolean().default(false),
  address: z.string(),
  signer: z.string().optional(),
  ensName: z.string().optional(),
  created: z.string(),
  balances: z.object({
    lastUpdated: z.number().optional()
  }),
  requests: z.record(z.string(), z.any()).default({})
})

export type AccountMetadata = z.infer<typeof AccountMetadataSchema>
export type Account = z.infer<typeof AccountSchema>
