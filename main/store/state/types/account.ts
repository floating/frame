import { z } from 'zod'

export const AccountMetadataSchema = z.object({})

export const AccountSchema = z.object({})

export type AccountMetadata = z.infer<typeof AccountMetadataSchema>
export type Account = z.infer<typeof AccountSchema>
