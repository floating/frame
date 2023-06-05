import log from 'electron-log'
import { z } from 'zod'

import { AddressSchema, ChainIdSchema, HexStringSchema } from '../../../state/types/utils'

type WithLogo = { logoURI?: string }

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

const v38StateSchema = z
  .object({
    main: z
      .object({
        tokens: z
          .object({
            known: z.record(z.array(z.unknown())).catch({}),
            custom: z.array(z.unknown()).catch([])
          })
          .default({
            known: {},
            custom: []
          })
      })
      .passthrough()
  })
  .passthrough()

const transformToken = <T extends WithLogo>({ logoURI = '', ...token }: T) => ({
  ...token,
  media: {
    source: logoURI,
    format: 'image',
    cdn: {}
  }
})

const transformKnownToken = (token: unknown) => {
  try {
    return v38TokenSchema.parse(token)
  } catch (e) {
    log.error('Migration 39: could not parse token', token, e)
    return token
  }
}

const migrate = (initial: unknown) => {
  try {
    const state = v38StateSchema.parse(initial)
    const tokens = state.main.tokens

    for (const address in tokens.known) {
      const knownTokensForAddress = tokens.known[address]
      state.main.tokens.known[address] = knownTokensForAddress.map(transformToken)
    }

    state.main.tokens.custom = state.main.tokens.custom.map(transformToken)
    return state
  } catch (e) {
    log.error('Migration 39: could not parse state', e)
    return initial
  }
}

export default {
  version: 39,
  migrate
}
