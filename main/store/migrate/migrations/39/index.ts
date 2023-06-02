import log from 'electron-log'
import { z } from 'zod'
import { AddressSchema, HexStringSchema } from '../../../state/types/utils'

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

const v39MediaSchema = z.object({
  source: z.string(),
  format: z.union([z.literal('image'), z.literal('video'), z.literal('')]),
  cdn: z.object({
    main: z.string().optional(),
    thumb: z.string().optional(),
    frozenThumb: z.string().optional()
  })
})

const v39KnownTokenSchema = z.object({
  chainId: z.number(),
  address: AddressSchema,
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  media: v39MediaSchema,
  balance: HexStringSchema,
  displayBalance: z.string()
})

const v39CustomTokenSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  chainId: z.number(),
  address: z.string(), //TODO: could/should we apply the regex here too - maybe not if we let users enter arbitrary strings for address
  decimals: z.number(),
  media: v39MediaSchema
})

type v39KnownToken = z.infer<typeof v39KnownTokenSchema>
type v39CustomToken = z.infer<typeof v39CustomTokenSchema>

export const v39MainSchema = z
  .object({
    tokens: z.object({
      known: z.record(
        z.array(
          z.union([
            v39KnownTokenSchema,
            v38KnownTokenSchema.transform((v) => {
              const { logoURI = '', ...knownToken } = v
              return {
                ...knownToken,
                media: {
                  source: logoURI,
                  format: 'image',
                  cdn: {}
                }
              }
            })
          ])
        )
      ),
      custom: z.array(
        z.union([
          v39CustomTokenSchema,
          v38CustomTokenSchema.transform((v) => {
            const { logoURI = '', ...customToken } = v
            return {
              ...customToken,
              media: {
                source: logoURI,
                format: 'image',
                cdn: {}
              }
            }
          })
        ])
      )
    })
  })
  .passthrough()

export const v39StateSchema = z
  .object({
    main: v39MainSchema
  })
  .passthrough()

const migrate = (initial: unknown) => {
  try {
    const migrated = v39StateSchema.parse(initial)
    return migrated
  } catch (e) {
    log.error('Migration 39: could not parse state', e)
  }

  return initial
}

export default {
  version: 39,
  migrate
}
