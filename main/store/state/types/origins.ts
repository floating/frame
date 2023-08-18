import log from 'electron-log'
import { z } from 'zod'
import { v5 as uuid } from 'uuid'

import { ChainIdSchema } from './chains'

const unknownOriginId = uuid('Unknown', uuid.DNS)

const SessionSchema = z.object({
  requests: z.number().gte(0).default(0),
  startedAt: z.number().gte(0).default(0),
  endedAt: z.number().gte(0).optional(),
  lastUpdatedAt: z.number().gte(0).default(0)
})

const OriginSchema = z.object({
  chain: ChainIdSchema,
  name: z.string(),
  session: SessionSchema
})

const v37 = z.record(z.string().describe('Origin Id'), OriginSchema)

const latestSchema = v37
const LatestOriginSchema = latestSchema.valueSchema

const OriginsSchema = z.record(z.unknown()).transform((originsObject) => {
  const origins = {} as Record<string, Origin>

  for (const id in originsObject) {
    const result = LatestOriginSchema.safeParse(originsObject[id])

    if (!result.success) {
      log.info(`Removing invalid origin ${id} from state`, result.error)
    } else if (id !== unknownOriginId) {
      // update session data, don't persist unknown origin
      const origin = result.data

      origins[id] = {
        ...origin,
        session: {
          requests: 0,
          startedAt: 0,
          lastUpdatedAt: 0,
          endedAt: origin.session.lastUpdatedAt
        }
      }
    }
  }

  return origins
})

const latest = OriginsSchema.catch((ctx) => {
  log.error('Could not parse origins, falling back to defaults', ctx.error)
  return {}
}).default({})

export { v37, latest }
export type Session = z.infer<typeof SessionSchema>
export type Origin = z.infer<typeof OriginSchema>
