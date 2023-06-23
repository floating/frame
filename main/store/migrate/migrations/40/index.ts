import log from 'electron-log'
import { z } from 'zod'

import { AddressSchema, ChainIdSchema, HexStringSchema } from '../../../state/types/utils'

const v39TokenSchema = z.object({
  name: z.string().default(''),
  symbol: z.string().default(''),
  chainId: ChainIdSchema,
  address: z.string(),
  decimals: z.number(),
  logoURI: z.string().optional()
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

export const v40MediaSchema = z.object({
  source: z.string(),
  format: z.enum(['image', 'video', '']),
  cdn: z.object({
    main: z.string().optional(),
    thumb: z.string().optional(),
    frozen: z.string().optional()
  })
})

export const v40TokenBalanceSchema = z.object({
  chainId: ChainIdSchema,
  address: AddressSchema,
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  media: v40MediaSchema,
  balance: HexStringSchema,
  displayBalance: z.string(),
  hideByDefault: z.boolean()
})

export const v40TokenSchema = z.object({
  name: z.string().default(''),
  symbol: z.string().default(''),
  chainId: ChainIdSchema,
  address: z.string(),
  decimals: z.number(),
  media: v40MediaSchema,
  hideByDefault: z.boolean()
})

const defaultTokensState = {
  known: {},
  custom: []
}

const v39StateSchema = z
  .object({
    main: z
      .object({
        tokens: z
          .object({
            known: z.record(z.array(z.unknown())).catch({}),
            custom: z.array(z.unknown()).catch([])
          })
          .catch(defaultTokensState)
          .default(defaultTokensState)
      })
      .passthrough()
  })
  .passthrough()

const v40StateSchema = z.object({
  main: z
    .object({
      tokens: z.object({
        known: z.record(z.array(v40TokenBalanceSchema)),
        custom: z.array(v40TokenSchema)
      })
    })
    .passthrough()
})

type v39Token = z.infer<typeof v39TokenSchema>
type v40Token = z.infer<typeof v40TokenSchema>
type v39TokenBalance = z.infer<typeof v39TokenBalanceSchema>
type v40TokenBalance = z.infer<typeof v40TokenBalanceSchema>
type v40State = z.infer<typeof v40StateSchema>

interface WithLogoURI {
  logoURI?: string
}

const migrateToken = <T extends WithLogoURI>({ logoURI, ...token }: T) => ({
  ...token,
  media: {
    source: logoURI || '',
    format: 'image' as const,
    cdn: {}
  },
  hideByDefault: false
})

const migrateKnownTokens = (knownTokens: Record<string, unknown[]>): Record<string, v40TokenBalance[]> =>
  Object.entries(knownTokens).reduce((acc, [address, tokens]) => {
    const migrated: v40TokenBalance[] = tokens
      .map((token) => v39TokenBalanceSchema.safeParse(token))
      .filter(({ success }) => !!success)
      .map((result) => migrateToken((result.success && result.data) as v39TokenBalance))

    return {
      ...acc,
      [address]: migrated
    }
  }, {} as Record<string, v40TokenBalance[]>)

const migrateCustomTokens = (customTokens: unknown[]): v40Token[] =>
  customTokens
    .map((token) => v39TokenSchema.safeParse(token))
    .filter(({ success }) => !!success)
    .map((result) => migrateToken((result.success && result.data) as v39Token))

const migrate = (initial: unknown) => {
  try {
    const v39State = v39StateSchema.parse(initial)
    const { known: knownTokens, custom: customTokens } = v39State.main.tokens

    const v40State: v40State = {
      ...v39State,
      main: {
        ...v39State.main,
        tokens: {
          known: migrateKnownTokens(knownTokens),
          custom: migrateCustomTokens(customTokens)
        }
      }
    }

    return v40State
  } catch (e) {
    log.error('Migration 40: could not parse state', e)
    return initial
  }
}

export default {
  version: 40,
  migrate
}
