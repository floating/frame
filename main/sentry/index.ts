import { init as initSentry, IPCMode } from '@sentry/electron'
import type { Event } from '@sentry/types'
import store from '../store'

const EVENT_RATE_LIMIT = 5

function getCrashReportFields () {
  const fields = ['networks', 'networksMeta', 'tokens']

  return fields.reduce((extra, field) => ({ ...extra, [field]: JSON.stringify(store('main', field) || {}) }), {})
}

function sanitizeStackFrame ({ module = '' }) {
  const matches = /(.+)[\\|\/]frame[\\|\/]resources[\\|\/]app.asar[\\|\/](.+)/.exec(module)
  if (matches && matches[2]) {
    return `{asar}/${matches[2].replaceAll('\\', '/')}`
  }
  return module
}

function getSentryExceptions (event: Event) {
  const exceptions = event?.exception?.values || []
  const safeExceptions = exceptions.map((exception) => {
    const frames = exception?.stacktrace?.frames || []
    const safeFrames = frames.map((frame) => ({ ...frame, module: sanitizeStackFrame(frame) }))
    return { stacktrace: { frames: safeFrames } }
  })
  
  return safeExceptions
}

export function init () {
  let eventLimit = EVENT_RATE_LIMIT

  setInterval(() => {
    if (eventLimit < EVENT_RATE_LIMIT) eventLimit++
  }, 60_000)
  
  initSentry({
    // only use IPC from renderer process, not HTTP
    ipcMode: IPCMode.Classic,
    dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069',
    beforeSend: (event: Event) => {
      if (eventLimit === 0) {
        return null
      }

      eventLimit--

      return {
        ...event,
        exception: { values: getSentryExceptions(event) },
        user: { ...event.user, ip_address: undefined }, // remove IP address
        tags: { ...event.tags, 'frame.instance_id': store('main.instanceId') },
        extra: getCrashReportFields()
      }
    }
  })
}
