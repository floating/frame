import { z } from 'zod'
import { v5 as uuid } from 'uuid'

import { ChainIdSchema } from './chain'

const SessionSchema = z.object({
  requests: z.number().gte(0),
  startedAt: z.number().gte(0),
  endedAt: z.number().gte(0).optional(),
  lastUpdatedAt: z.number().gte(0)
})

const OriginSchema = z.object({
  chain: ChainIdSchema,
  name: z.string(),
  session: SessionSchema
})

export const KnownOriginsSchema = z
  .record(z.string().describe('Origin Id'), OriginSchema)
  .transform((origins) => {
    // update session data, don't persist unknown origin
    return Object.entries(origins).reduce((allOrigins, [id, origin]) => {
      if (id !== uuid('Unknown', uuid.DNS)) {
        allOrigins[id] = {
          ...origin,
          session: {
            ...origin.session,
            endedAt: origin.session.lastUpdatedAt
          }
        }
      }

      return allOrigins
    }, {} as Record<string, Origin>)
  })

export type Session = z.infer<typeof SessionSchema>
export type Origin = z.infer<typeof OriginSchema>
