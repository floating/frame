import { z } from 'zod'

import { v40TokenBalanceSchema, v40TokenSchema } from '../../migrate/migrations/40'
import { AddressSchema, ChainIdSchema, HexStringSchema } from './common'

const TokenIdSchema = z.object({
  address: z.string(),
  chainId: z.coerce.number()
})

const v39TokenBalanceSchema = z.object({
  chainId: ChainIdSchema,
  address: AddressSchema,
  name: z.string().default(''),
  symbol: z.string().default(''),
  decimals: z.number(),
  logoURI: z.string().optional(),
  balance: HexStringSchema.default('0x0'),
  displayBalance: z.string().default('0')
})

export const TokenSchema = v40TokenSchema
export const TokenBalanceSchema = v40TokenBalanceSchema

export type WithTokenId = z.infer<typeof TokenIdSchema>
export type Token = z.infer<typeof TokenSchema>
export type TokenBalance = z.infer<typeof TokenBalanceSchema>
