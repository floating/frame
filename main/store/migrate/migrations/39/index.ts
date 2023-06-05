import log from 'electron-log'
import { Schema, z } from 'zod'

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

type V39Media = z.infer<typeof v39MediaSchema>

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
      tokens: z

        .object({
          known: z.record(z.array(v39TokenBalanceSchema)).catch({}),
          custom: z.array(v39TokenSchema).catch([])
        })
        .catch(defaultTokensState)
        .default(defaultTokensState)
    })
    .passthrough()
})

const transformToken = <S extends Schema>(
  token: unknown,
  schemaIn: Schema,
  schemaOut: S
): Array<z.infer<S>> => {
  const parsed = schemaIn.safeParse(token)
  if (!parsed.success) {
    log.error('Migration 39: could not parse token', token, parsed.error)
    return []
  }

  const { logoURI = '', ...tokenData } = parsed.data

  const parsedOut = schemaOut.safeParse({
    ...tokenData,
    media: {
      source: logoURI,
      format: 'image',
      cdn: {}
    }
  })

  return parsedOut.success ? [parsedOut.data] : []
}

const transformKnownToken = (token: unknown) =>
  transformToken(token, v38TokenBalanceSchema, v39TokenBalanceSchema)

const transformCustomToken = (token: unknown) => transformToken(token, v38TokenSchema, v39TokenSchema)

const migrate = (initial: unknown) => {
  try {
    const state = v38StateSchema.parse(initial)
    const tokens = state.main.tokens

    for (const address in tokens.known) {
      const knownTokensForAddress = tokens.known[address]
      state.main.tokens.known[address] = knownTokensForAddress.flatMap(transformKnownToken)
    }

    state.main.tokens.custom = state.main.tokens.custom.flatMap(transformCustomToken)
    return v39StateSchema.parse(state)
  } catch (e) {
    log.error('Migration 39: could not parse state', e)
    return initial
  }
}

export default {
  version: 39,
  migrate
}
