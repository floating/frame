import * as Sentry from '@sentry/electron'
import type { Event } from '@sentry/electron'

import store from '../store'

const EVENT_RATE_LIMIT = 5

function getCrashReportFields() {
  const fields = ['networks', 'networksMeta', 'tokens']

  return fields.reduce(
    (extra, field) => ({ ...extra, [field]: JSON.stringify(store('main', field) || {}) }),
    {}
  )
}

function sanitizeStackFrame({ module = '' }) {
  const matches = /(.+)[\\|\/]frame[\\|\/]resources[\\|\/]app.asar[\\|\/](.+)/.exec(module)
  if (matches && matches[2]) {
    return `{asar}/${matches[2].replaceAll('\\', '/')}`
  }
  return module
}

function getSentryExceptions(event: Event) {
  const exceptions = event?.exception?.values || []
  const safeExceptions = exceptions.map((exception) => {
    const frames = exception?.stacktrace?.frames || []
    const safeFrames = frames.map((frame) => ({ ...frame, module: sanitizeStackFrame(frame) }))
    return { ...exception, stacktrace: { frames: safeFrames } }
  })

  return safeExceptions
}

export function init() {
  let allowedEvents = EVENT_RATE_LIMIT

  const backOffRateLimitBy = (numEventsToAllow: number) => {
    allowedEvents = Math.min(EVENT_RATE_LIMIT, allowedEvents + numEventsToAllow)
  }

  const filterEvent = () => {
    return allowedEvents <= 0 || !store('main.privacy.errorReporting')
  }

  setInterval(() => backOffRateLimitBy(1), 60_000)

  Sentry.init({
    // only use IPC from renderer process, not HTTP
    ipcMode: Sentry.IPCMode.Classic,
    dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069',
    beforeSend: (event: Event) => {
      if (filterEvent()) return null

      allowedEvents--

      return {
        ...event,
        exception: { values: getSentryExceptions(event) },
        user: { ...event.user, ip_address: undefined }, // remove IP address
        tags: { ...event.tags, 'frame.instance_id': store('main.instanceId') },
        extra: getCrashReportFields(),
      }
    },
  })
}
