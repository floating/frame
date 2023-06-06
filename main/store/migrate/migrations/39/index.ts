import log from 'electron-log'
import { z } from 'zod'

import { AddressSchema, ChainIdSchema, HexStringSchema } from '../../../state/types/utils'

const v38TokenSchema = z.object({
  name: z.string().default(''),
  symbol: z.string().default(''),
  chainId: ChainIdSchema,
  address: z.string(),
  decimals: z.number(),
  logoURI: z.string().optional()
})

const v38TokenBalanceSchema = z.object({
  chainId: ChainIdSchema,
  address: AddressSchema,
  name: z.string().default(''),
  symbol: z.string().default(''),
  decimals: z.number(),
  logoURI: z.string().optional(),
  balance: HexStringSchema.default('0x0'),
  displayBalance: z.string().default('0')
})

export const v39MediaSchema = z.object({
  source: z.string(),
  format: z.enum(['image', 'video', '']),
  cdn: z.object({
    main: z.string().optional(),
    thumb: z.string().optional(),
    frozenThumb: z.string().optional()
  })
})

export const v39TokenBalanceSchema = z.object({
  chainId: ChainIdSchema,
  address: AddressSchema,
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  media: v39MediaSchema,
  balance: HexStringSchema,
  displayBalance: z.string()
})

export const v39TokenSchema = z.object({
  name: z.string().default(''),
  symbol: z.string().default(''),
  chainId: ChainIdSchema,
  address: z.string(),
  decimals: z.number(),
  media: v39MediaSchema
})

const defaultTokensState = {
  known: {},
  custom: []
}

const v38StateSchema = z
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

const v39StateSchema = z.object({
  main: z
    .object({
      tokens: z.object({
        known: z.record(z.array(v39TokenBalanceSchema)),
        custom: z.array(v39TokenSchema)
      })
    })
    .passthrough()
})

type v38Token = z.infer<typeof v38TokenSchema>
type v39Token = z.infer<typeof v39TokenSchema>
type v38TokenBalance = z.infer<typeof v38TokenBalanceSchema>
type v39TokenBalance = z.infer<typeof v39TokenBalanceSchema>
type v39State = z.infer<typeof v39StateSchema>

interface WithLogoURI {
  logoURI?: string
}

const migrateToken = <T extends WithLogoURI>({ logoURI, ...token }: T) => ({
  ...token,
  media: {
    source: logoURI || '',
    format: 'image' as const,
    cdn: {}
  }
})

const migrateKnownTokens = (knownTokens: Record<string, unknown[]>): Record<string, v39TokenBalance[]> =>
  Object.entries(knownTokens).reduce((acc, [address, tokens]) => {
    const migrated: v39TokenBalance[] = tokens
      .map((token) => v38TokenBalanceSchema.safeParse(token))
      .filter(({ success }) => !!success)
      .map((result) => migrateToken((result.success && result.data) as v38TokenBalance))

    return {
      ...acc,
      [address]: migrated
    }
  }, {} as Record<string, v39TokenBalance[]>)

const migrateCustomTokens = (customTokens: unknown[]): v39Token[] =>
  customTokens
    .map((token) => v38TokenSchema.safeParse(token))
    .filter(({ success }) => !!success)
    .map((result) => migrateToken((result.success && result.data) as v38Token))

const migrate = (initial: unknown) => {
  try {
    const v38State = v38StateSchema.parse(initial)
    const { known: knownTokens, custom: customTokens } = v38State.main.tokens

    const v39State: v39State = {
      ...v38State,
      main: {
        ...v38State.main,
        tokens: {
          known: migrateKnownTokens(knownTokens),
          custom: migrateCustomTokens(customTokens)
        }
      }
    }

    return v39State
  } catch (e) {
    log.error('Migration 39: could not parse state', e)
    return initial
  }
}

export default {
  version: 39,
  migrate
}
