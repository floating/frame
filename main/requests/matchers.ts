import { z, ZodObject } from 'zod'

export function createRequestMatcher(method: string, params: ZodObject<any>) {
  return z.object({
    id: z.number(),
    jsonrpc: z.literal('2.0'),
    params
  })
}
