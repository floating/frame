import { z } from 'zod'

import { v39 as LegacyTokensSchema, v40 as NewTokensSchema } from '../../../state/types/tokens'

const InputSchema = z
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

const migrateToken = <T extends WithLogoURI>({ logoURI = '', ...token }: T) => ({
  ...token,
  media: {
    source: logoURI,
    format: 'image' as const,
    cdn: {}
  },
  hideByDefault: false
})

const migrateKnownTokens = (knownTokens: Record<string, v39TokenBalance[]>) => {
  const tokens: Record<string, v40TokenBalance[]> = {}
  for (const address in knownTokens) {
    tokens[address] = (knownTokens[address] || []).map(migrateToken)
  }

  return tokens
}

const migrateCustomTokens = (customTokens: v39Token[]): v40Token[] => customTokens.map(migrateToken)

const migrate = (initial: unknown) => {
  const state = InputSchema.parse(initial)
  const { known: knownTokens, custom: customTokens } = state.main.tokens

  const updatedState: OutputState = {
    ...state,
    main: {
      ...state.main,
      tokens: {
        known: migrateKnownTokens(knownTokens),
        custom: migrateCustomTokens(customTokens)
      }
    }
  }

  return updatedState
}

export default {
  version: 40,
  migrate
}
