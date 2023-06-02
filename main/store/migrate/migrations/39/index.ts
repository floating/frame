import log from 'electron-log'
import { z } from 'zod'
import { AddressSchema, HexStringSchema } from '../../../state/types/utils'
type WithLogo = { logoURI: string }

const v38CustomTokenSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  chainId: z.number(),
  address: z.string(),
  decimals: z.number(),
  logoURI: z.string().optional()
})

const v38KnownTokenSchema = z.object({
  chainId: z.number(),
  address: AddressSchema,
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  logoURI: z.string().optional(),
  balance: HexStringSchema,
  displayBalance: z.string()
})

export const v39MediaSchema = z.object({
  source: z.string(),
  format: z.union([z.literal('image'), z.literal('video'), z.literal('')]),
  cdn: z.object({
    main: z.string().optional(),
    thumb: z.string().optional(),
    frozenThumb: z.string().optional()
  })
})

export const v39KnownTokenSchema = z.object({
  chainId: z.number(),
  address: AddressSchema,
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  media: v39MediaSchema,
  balance: HexStringSchema,
  displayBalance: z.string()
})

export const v39CustomTokenSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  chainId: z.number(),
  address: z.string(),
  decimals: z.number(),
  media: v39MediaSchema
})

const v38StateSchema = z.object({
  main: z.object({
    tokens: z.object({
      known: z.record(z.array(v38KnownTokenSchema)),
      custom: z.array(v38CustomTokenSchema)
    })
  })
})

const transformToken = <T extends WithLogo>(token: T) => {
  const { logoURI = '', ...restToken } = token
  return {
    ...restToken,
    media: {
      source: logoURI,
      format: 'image',
      cdn: {}
    }
  }
}

const migrateKnownToken = (token: any) => {
  try {
    v38KnownTokenSchema.parse(token)
    return transformToken(token)
  } catch {
    return token
  }
}

const migrateCustomToken = (token: any) => {
  try {
    v38CustomTokenSchema.parse(token)
    return transformToken(token)
  } catch {
    return { ...token, media: { source: '', format: 'image', cdn: {} } }
  }
}

const migrate = (initial: unknown) => {
  try {
    const state = v38StateSchema.parse(initial)
    for (const key in state.main.tokens.known) {
      state.main.tokens.known[key] = state.main.tokens.known[key].map(migrateKnownToken)
    }
    state.main.tokens.custom = state.main.tokens.custom.map(migrateCustomToken)
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
