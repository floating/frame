import log from 'electron-log'

const has = (value: any) => value !== null && value !== undefined

export default function <T extends JSONRPCRequestPayload>(data: string): T | false {
  try {
    const payload = (JSON.parse(data) as T) || {}

    if (has(payload.id) && has(payload.method)) {
      if (!payload.params) payload.params = []

      return (
        !!(
          (typeof payload.id === 'number' || typeof payload.id === 'string') &&
          typeof payload.jsonrpc === 'string' &&
          typeof payload.method === 'string' &&
          (Array.isArray(payload.params) || typeof payload.params === 'object')
        ) && payload
      )
    }
  } catch (e) {
    log.info('Error parsing payload: ', data, e)
  }

  return false
}
