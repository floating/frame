import log from 'electron-log'
import { z } from 'zod'

import { AddressSchema, ChainIdSchema, HexStringSchema } from './common'
import { v40 as v40MediaSchema } from './media'

const defaultTokensState = {
  known: {},
  custom: []
}

const TokenIdSchema = z.object({
  address: z.string(),
  chainId: z.coerce.number()
})

const v39TokenBalance = z.object({
  chainId: ChainIdSchema,
  address: AddressSchema,
  name: z.string().default(''),
  symbol: z.string().default(''),
  decimals: z.number(),
  logoURI: z.string().optional(),
  balance: HexStringSchema.default('0x0'),
  displayBalance: z.string().default('0')
})

export const v40TokenBalance = v39TokenBalance.omit({ logoURI: true }).extend({
  media: v40MediaSchema,
  hideByDefault: z.boolean().default(false)
})

const v39Token = z.object({
  name: z.string().default(''),
  symbol: z.string().default(''),
  chainId: ChainIdSchema,
  address: z.string(),
  decimals: z.number(),
  logoURI: z.string().optional()
})

const v40Token = v39Token.omit({ logoURI: true }).extend({
  media: v40MediaSchema,
  hideByDefault: z.boolean().default(false)
})

const v39 = z.object({
  known: z.record(z.array(v39TokenBalance)),
  custom: z.array(v39Token)
})

const v40 = z.object({
  known: z.record(z.array(v40TokenBalance)),
  custom: z.array(v40Token)
})

const latestSchema = v40
const LatestTokenBalanceSchema = latestSchema.shape.known.valueSchema.element
const LatestTokenSchema = latestSchema.shape.custom.element

const latestKnownTokens = z.record(z.array(z.unknown())).transform((knownTokensObject) => {
  const knownTokens = {} as Record<string, TokenBalance[]>
  for (const address in knownTokensObject) {
    const tokens = knownTokensObject[address]
    const results: TokenBalance[] = tokens
      .map((token) => LatestTokenBalanceSchema.safeParse(token))
      .filter((result) => {
        if (!result.success) {
          log.info(`Removing invalid known token from state`, result.error)
          return false
        }

        return true
      })
      .map((result) => (result.success && result.data) as TokenBalance)

    knownTokens[address] = results
  }

  return knownTokens
})

const latestCustomTokens = z.array(z.unknown()).transform((customTokensArray) => {
  return customTokensArray
    .map((token) => LatestTokenSchema.safeParse(token))
    .filter((result) => {
      if (!result.success) {
        log.info(`Removing invalid custom token from state`, result.error)
        return false
      }

      return true
    })
    .map((result) => (result.success && result.data) as Token)
})

const latest = z
  .object({
    known: latestKnownTokens,
    custom: latestCustomTokens
  })
  .catch((ctx) => {
    log.error('Could not parse tokens, falling back to defaults', ctx.error)
    return defaultTokensState
  })
  .default(defaultTokensState)

export { v39, v40, latest }

export type WithTokenId = z.infer<typeof TokenIdSchema>
export type Token = z.infer<typeof LatestTokenSchema>
export type TokenBalance = z.infer<typeof LatestTokenBalanceSchema>
