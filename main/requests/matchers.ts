import { z, ZodError, ZodObject } from 'zod'

export function createRequestMatcher(method: string, params: ZodObject<any>) {
  return z.object({
    id: z.number(),
    jsonrpc: z.literal('2.0'),
    params
  })
}

export function generateError(err: ZodError<any>) {
  const errorMessage = err.issues[0].message || ''

  if (errorMessage.toLowerCase() === 'required') {
    const field = err.issues[0].path.pop()
    return `${field} parameter is required`
  }

  return new Error(errorMessage)
}
