// TODO: finish converting this

import log from 'electron-log'
import { z } from 'zod'

import { v39 as LegacyTokensSchema, v40 as NewTokensSchema } from '../../../state/types/tokens'

const v39StateSchema = z
  .object({
    main: z
      .object({
        tokens: LegacyTokensSchema
      })
      .passthrough()
  })
  .passthrough()

const OutputSchema = z.object({
  main: z.object({
    tokens: NewTokensSchema
  })
})

type v39Token = z.infer<typeof LegacyTokensSchema.shape.custom.element>
type v40Token = z.infer<typeof NewTokensSchema.shape.custom.element>
type v39TokenBalance = z.infer<typeof LegacyTokensSchema.shape.known.valueSchema.element>
type v40TokenBalance = z.infer<typeof NewTokensSchema.shape.known.valueSchema.element>
type OutputState = z.infer<typeof OutputSchema>

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
      .map((token) => LegacyTokensSchema.shape.known.valueSchema.element.safeParse(token))
      .filter(({ success }) => !!success)
      .map((result) => migrateToken((result.success && result.data) as v39TokenBalance))

    return {
      ...acc,
      [address]: migrated
    }
  }, {} as Record<string, v40TokenBalance[]>)

const migrateCustomTokens = (customTokens: unknown[]): v40Token[] =>
  customTokens
    .map((token) => LegacyTokensSchema.shape.custom.element.safeParse(token))
    .filter(({ success }) => !!success)
    .map((result) => migrateToken((result.success && result.data) as v39Token))

const migrate = (initial: unknown) => {
  try {
    const v39State = v39StateSchema.parse(initial)
    const { known: knownTokens, custom: customTokens } = v39State.main.tokens

    const v40State: OutputState = {
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
