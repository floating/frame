import { z } from 'zod'

import { ChainMetadataSchema, ChainSchema } from './chain'

export type { Chain, ChainMetadata } from './chain'
export type { Connection } from './connection'
export type { NativeCurrency } from './nativeCurrency'
export type { Gas, GasFees } from './gas'
export type { Rate } from './rate'
export type { ColorwayPalette } from './colors'

export const StateSchema = z.object({
  main: z.object({
    _version: z.coerce.number(),
    networks: z.object({
      ethereum: z.record(z.coerce.number(), ChainSchema)
    }),
    networksMeta: z.object({
      ethereum: z.record(z.coerce.number(), ChainMetadataSchema)
    })
  })
})

export type State = z.infer<typeof StateSchema>
